import { GoogleGenAI } from "@google/genai";
import { TOOL_IMPLEMENTATIONS, TOOLS } from "./tools";
import { getAgentLoopPrompt } from "./prompts/agent-loop-prompt";
import { askQuestion, truncateResult } from "./utils/tool.utils";
import { getSummary, MAX_SESSION_MESSAGES } from "./utils/ai.utils";
import { sessionManager } from "./manager/session.manager";

const MAX_STEPS = 10;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("process.env.GEMINI_API_KEY not found")
}

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function agentLoop(input: string, sessionId: string) {
  try {
    let steps = 0;
    let tokens = 0;
    let firstTurn = true;
    let perLlmReqToken: number[] = [];
    
    const sessionMessages = sessionManager.getSessionMsg(sessionId);
    
    if (sessionMessages.length >= MAX_SESSION_MESSAGES) {
      console.log("summarizing")
      const summarizedMessages = await getSummary(sessionMessages);
      sessionManager.setSessionMsg(sessionId, summarizedMessages);
    }
    
    while (true) {
      steps++;
            
      if (steps > MAX_STEPS) {
        const answer = await askQuestion(
          `Agent has used ${MAX_STEPS} steps without finishing. Continue? (y/n) `
        );
        if (answer.trim().toLowerCase() === "y") {
          steps = 0;
          continue;
        } else {
          break;
        }
      }
      
      const sessionMessages = sessionManager.getSessionMsg(sessionId);
      
      if (firstTurn) {
        sessionMessages.push({
          role: "user",
          parts: [{ text: input }]
        })
        firstTurn = false;
      }

      
      let textResponseAccumulated = "";
      let stream;
      let functionCalls = false;
      
      try {
        stream = await client.models.generateContentStream({
          contents: sessionMessages,
          model: "gemini-3.5-flash",
          config: {
            systemInstruction: getAgentLoopPrompt(),
            tools: TOOLS,
          }
        });
      } catch (e) {
        console.log("API ERROR", e);
        throw new Error("API ERROR");
      }

      for await (const event of stream) {
        const thoughtSignature = event?.candidates?.[0]?.content?.parts?.[0]?.thoughtSignature;

        if (event.usageMetadata && typeof event.usageMetadata.totalTokenCount === "number") {
          tokens += event.usageMetadata?.totalTokenCount
          perLlmReqToken.push(event.usageMetadata?.totalTokenCount)
        }
        
        if (event?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
          const toolToCall = event?.candidates?.[0]?.content?.parts?.[0]?.functionCall
                    
          functionCalls = true;
                    
          console.log("tool getting called", toolToCall.name);
          
          if (toolToCall.name) {
            if (toolToCall.name === "ASK_QUESTION" || toolToCall.name === "CREATE_PLAN") {            
              sessionMessages.push({
                parts: [{
                  functionCall: {
                    name: toolToCall.name,
                    id: toolToCall.id,
                    args: toolToCall.args
                  },
                  thoughtSignature
                }],
                role: "model"
              });
              
              // TODO: handle other tools here too
              const question = `\n\n${toolToCall.name === "ASK_QUESTION" ? `kindly answer these questions\n\n ${JSON.stringify(toolToCall.args)}\n\n` : `kindly approve the plan or let us know the issues with the plan\n\n ${JSON.stringify(toolToCall.args)}`}\n\n`;
              
              const answer = await askQuestion(question);
              
              // TODO: handle it more gracefully.
              if (!answer) throw new Error("user input not provided");
              
              sessionMessages.push({
                role: "user",
                parts: [{
                  functionResponse: {
                    name: toolToCall.name,
                    response: { answer },
                  },
                  thoughtSignature
                }]
              });
            } else if (toolToCall.name === "BASH") {
              // TODO: handle other tools here too
              const question = `\n\nAGENT wants to run a bash command \n\n ${JSON.stringify(toolToCall.args, null, 2)} \n\n Y/N ??`;
              
              const answer = await askQuestion(question);

              const approved = answer.trim().toLowerCase() === "y";

              if (!approved) {
                sessionMessages.push({
                  role: "user",
                  parts: [{
                    functionResponse: {
                      name: toolToCall.name,
                      response: { answer: `user do not want you to run bash command: ${JSON.stringify(toolToCall.args, null, 2)}, so avoid commands like these in future steps.` },
                    },
                    thoughtSignature
                  }]
                });
              } else {
                sessionMessages.push({
                  parts: [{
                    functionCall: {
                      name: toolToCall.name,
                      id: toolToCall.id,
                      args: toolToCall.args
                    },
                    thoughtSignature
                  }],
                  role: "model"
                });
                
                const fn = TOOL_IMPLEMENTATIONS[toolToCall.name];
                const response = await fn({ command: toolToCall.args.command, sessionId });
                                
                if (response ===  undefined) {
                  // TODO: how should we handle..
                } else {
                  sessionMessages.push({
                    parts: [{
                      functionResponse: {
                        name: toolToCall.name,
                        id: toolToCall.id,
                        response: { response: truncateResult(response) }
                      },
                      thoughtSignature
                    }],
                    role: "model"
                  });
                }                
              }
            } else if (toolToCall.name === "SAVE_MEMORY") {
                sessionMessages.push({
                  parts: [{
                    functionCall: {
                      name: toolToCall.name,
                      id: toolToCall.id,
                      args: toolToCall.args
                    },
                    thoughtSignature
                  }],
                  role: "model"
                });
                
                const fn = TOOL_IMPLEMENTATIONS[toolToCall.name];
                const response = await fn(toolToCall.args);

                sessionMessages.push({
                  parts: [{
                    functionResponse: {
                      name: toolToCall.name,
                      id: toolToCall.id,
                      response: { response: response }
                    },
                    thoughtSignature
                  }],
                  role: "model"
                });                                
            }
          }          
        } else if (!functionCalls && typeof event?.candidates?.[0]?.content?.parts?.[0]?.text === "string" && !event?.candidates?.[0]?.content?.parts?.[0]?.text.includes("non-text")) {
          textResponseAccumulated += event?.candidates?.[0]?.content?.parts?.[0]?.text
        }
      }

      console.log("total token got used", tokens);
      console.log("total token per llm request", perLlmReqToken);
      console.log(textResponseAccumulated)
      
      if (!functionCalls) {
        sessionMessages.push({
          role: "model",
          parts: [{ text: textResponseAccumulated }]
        });
      }
      
      console.log("sessionMessages length", sessionMessages.length);
      
      // STORING MESSAGES
      sessionManager.setSessionMsg(sessionId, sessionMessages);
      
      if (!functionCalls) break;
    }
    
    sessionManager.storeAllMessages()
    return { success: true }
  } catch (err) {
    console.log("ERROR", err)
    sessionManager.storeAllMessages()
    return { success: false }
  }
}