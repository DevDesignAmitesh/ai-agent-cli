import { TOOL_IMPLEMENTATIONS } from "./tools";
import { getAgentLoopPrompt } from "./prompts/agent-loop-prompt";
import { askQuestion, truncateResult } from "./utils/tool.utils";
import { getSummary, MAX_SESSION_MESSAGES } from "./utils/ai.utils";
import { sessionManager } from "./manager/session.manager";
import { multiProvider } from "./ai-providers/multiProvider";
import type { FunctionCall, MultiProvidersResponse, providers } from "./types";
import { TOOLS as GEMINI_TOOLS } from "./ai-providers/gemini/tools";
import { TOOLS as OPENAI_TOOLS } from "./ai-providers/openai/tools";

const MAX_STEPS = 10;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("process.env.GEMINI_API_KEY not found")
}

export async function agentLoop(input: string, sessionId: string, isThereFileChanges: boolean, userSpecifiedProvider: providers) {
  try {
    let steps = 0;
    let tokens = 0;
    let firstTurn = true;
    
    // const sessionMessages = sessionManager.getSessionMsg(sessionId);
    
    // if (sessionMessages[userSpecifiedProvider].length >= MAX_SESSION_MESSAGES) {
    //   console.log("summarizing")
    //   const summarizedMessages = await getSummary(sessionMessages);
    //   sessionManager.setSessionMsg(sessionId, summarizedMessages);
    // }
    
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

      console.log(JSON.stringify(sessionMessages, null, 2))
      
      if (firstTurn) {
        sessionMessages.gemini.push({
          role: "user",
          parts: [{ text: input }]
        });
        sessionMessages.openai.push({
          role: "user",
          content: `
            <USER_QUERY>
              ${input}
            <USER_QUERY>
          `,
        });
        firstTurn = false;
      }

      let textResponseAccumulated = "";
      // let stream;
      let functionCalls = false;
      let dataFromMultiProvider: MultiProvidersResponse | null;
      let toolToCall: FunctionCall | undefined;
      // for gemini mostly (will be used in the messages)
      let thoughtSignature: string | undefined;

      try {
        if (userSpecifiedProvider === "gemini") {
          dataFromMultiProvider = await multiProvider({
            provider: userSpecifiedProvider,
            contents: sessionMessages.gemini,
            model: "gemini-3.5-flash",
            config: {
              systemInstruction: getAgentLoopPrompt(),
              tools: GEMINI_TOOLS,
            }
          });
        } else if (userSpecifiedProvider === "openai") {
          dataFromMultiProvider = await multiProvider({
            provider: userSpecifiedProvider,
            input: [
              {
                role: "system",
                content: getAgentLoopPrompt()
              },
              ...sessionMessages.openai
            ],
            model: "chatgpt-4o-latest",
            tools: OPENAI_TOOLS,
          });
        } else {
          dataFromMultiProvider = null
        }
        
      } catch (e) {
        console.log("API ERROR", e);
        throw new Error("API ERROR");
      }

      if (dataFromMultiProvider === null) throw new Error("satisfying TS");
      
      const { 
        moreFunctionCall, 
        totalToken, 
        streamingText, 
        thoughtSignature: signature, 
        toolToCall: toolCall
      } = dataFromMultiProvider;
      
      if (streamingText) {
        textResponseAccumulated = streamingText;
      }
      
      if (signature) {
        thoughtSignature = signature;
      }
      
      if (toolCall) {
        toolToCall = toolCall
      }

      tokens = totalToken;
      functionCalls = moreFunctionCall;
      
      if (toolToCall && toolToCall.name) {
        if (toolToCall.name === "ASK_QUESTION" || toolToCall.name === "CREATE_PLAN") {            
          sessionMessages.gemini.push({
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

          sessionMessages.openai.push({
            content: `
              <TOOL_TO_USE>
                ${JSON.stringify(toolToCall)}
              <TOOL_TO_USE>
            `,
            role: "system"
          });
          
          // TODO: handle other tools here too
          const question = `\n\n${toolToCall.name === "ASK_QUESTION" ? `kindly answer these questions\n\n ${JSON.stringify(toolToCall.args)}\n\n` : `kindly approve the plan or let us know the issues with the plan\n\n ${JSON.stringify(toolToCall.args)}`}\n\n`;
          
          const answer = await askQuestion(question);
          
          // TODO: handle it more gracefully.
          if (!answer) throw new Error("user input not provided");
          
          sessionMessages.gemini.push({
            role: "user",
            parts: [{
              functionResponse: {
                name: toolToCall.name,
                response: { answer },
              },
              thoughtSignature
            }]
          });
          sessionMessages.openai.push({
            role: "user",
            content: `
              <TOOL_RESPONSE>
                ${JSON.stringify(answer)}
              <TOOL_RESPONSE>
            `,
          });
        } else if (toolToCall.name === "BASH") {
          // TODO: handle other tools here too
          const question = `\n\nAGENT wants to run a bash command \n\n ${JSON.stringify(toolToCall.args, null, 2)} \n\n Y/N ??`;
          
          const answer = await askQuestion(question);

          const approved = answer.trim().toLowerCase() === "y";

          if (!approved) {
            sessionMessages.gemini.push({
              role: "user",
              parts: [{
                functionResponse: {
                  name: toolToCall.name,
                  response: { answer: `user do not want you to run bash command: ${JSON.stringify(toolToCall.args, null, 2)}, so avoid commands like these in future steps.` },
                },
                thoughtSignature
              }]
            });
            sessionMessages.openai.push({
              role: "user",
              content: `
                <TOOL_RESPONSE>
                  user do not want you to run bash command: ${JSON.stringify(toolToCall.args, null, 2)}, so avoid commands like these in future steps.
                <TOOL_RESPONSE>
              `,
            });
          } else {
            isThereFileChanges = true;

            sessionMessages.gemini.push({
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
            sessionMessages.openai.push({
              content: `
                <TOOL_TO_USE>
                  ${JSON.stringify(toolToCall)}
                <TOOL_TO_USE>
              `,
              role: "system"
            });
                        
            const fn = TOOL_IMPLEMENTATIONS[toolToCall.name];
            const response = await fn({ command: toolToCall.args.command, sessionId });
                                        
            console.log(truncateResult(response));
            
            sessionMessages.gemini.push({
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
            sessionMessages.openai.push({
              content: `
              <TOOL_RESPONSE>
                ${JSON.stringify(truncateResult(response))}
              <TOOL_RESPONSE>
              `,
              role: "system"
            });
          }
        } else if (toolToCall.name === "SAVE_MEMORY") {
            sessionMessages.gemini.push({
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
            
            sessionMessages.openai.push({
              content: `
                <TOOL_TO_USE>
                  ${JSON.stringify(toolToCall)}
                <TOOL_TO_USE>
              `,
              role: "system"
            });

            const fn = TOOL_IMPLEMENTATIONS[toolToCall.name];
            const response = await fn(toolToCall.args);

            sessionMessages.gemini.push({
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

            sessionMessages.openai.push({
              content: `
              <TOOL_RESPONSE>
                ${JSON.stringify(response)}
              <TOOL_RESPONSE>
              `,
              role: "system"
            });

        }
      }
      
      console.log(textResponseAccumulated)
      
      if (!functionCalls) {
        sessionMessages.gemini.push({
          role: "model",
          parts: [{ text: textResponseAccumulated }]
        });
        sessionMessages.openai.push({
          role: "system",
          content: `
            <ASSISTANT_RESPONSE>
              ${textResponseAccumulated}
            <ASSISTANT_RESPONSE>
          `,
        });
      }

      // STORING MESSAGES
      sessionManager.setSessionMsg(sessionId, sessionMessages);
      
      if (!functionCalls) break;
    }
    
    sessionManager.storeAllMessages();
    return { success: true }
  } catch (err) {
    console.log("ERROR", err)
    sessionManager.storeAllMessages()
    return { success: false }
  }
}
