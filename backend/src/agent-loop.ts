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

if (!process.env.GEMINI_API_KEY || !process.env.OPENAI_API_KEY) {
  throw new Error("GEMINI_API_KEY or OPENAI_API_KEY not found")
}

export async function agentLoop(input: string, sessionId: string, userSpecifiedProvider: providers, projectPath: string) {
  try {
    // tracking number of time loop runs
    let steps = 0;
    // total tokens in each run
    let tokens = 0;
    // tracking for the first time
    let firstTurn = true;
    
    const sessionMessages = sessionManager.getSessionMsg(sessionId);
    
    if (sessionMessages[userSpecifiedProvider].length >= MAX_SESSION_MESSAGES) {
      console.log("summarizing the conversation")
      const summarizedMessages = await getSummary(sessionMessages, userSpecifiedProvider);
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
          throw new Error("MAX_STEPS reached.")
        }
      }
      
      const sessionMessages = sessionManager.getSessionMsg(sessionId);
      
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
      let functionCalls = false;
      let dataFromMultiProvider: MultiProvidersResponse | null;
      let toolToCall: FunctionCall | undefined;
      // for gemini mostly (will be stored in the message history)
      let thoughtSignature: string | undefined;

      try {
        if (userSpecifiedProvider === "gemini") {
          dataFromMultiProvider = await multiProvider({
            provider: userSpecifiedProvider,
            contents: sessionMessages.gemini,
            model: "gemini-3.5-flash",
            config: {
              systemInstruction: getAgentLoopPrompt(projectPath),
              tools: GEMINI_TOOLS,
            }
          });
        } else if (userSpecifiedProvider === "openai") {
          dataFromMultiProvider = await multiProvider({
            provider: userSpecifiedProvider,
            input: [
              {
                role: "system",
                content: getAgentLoopPrompt(projectPath)
              },
              ...sessionMessages.openai
            ],
            model: "gpt-5.6",
            tools: OPENAI_TOOLS,
          });
        } else {
          dataFromMultiProvider = null
        }
        
      } catch (e) {
        console.log("API ERROR", e);
        throw new Error("API ERROR");
      }

      if (dataFromMultiProvider === null) {
        throw new Error("Unable to get respone from llm providers");
      }

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
        console.log("\n\nUSING TOOL:", toolCall.name)
      }
      
      tokens = totalToken;
      console.log("TOKEN USED:", tokens)
      
      functionCalls = moreFunctionCall;
      
      // refractored (total 100 lines)
      if (toolToCall && functionCalls) {
        const { name, args, id } = toolToCall;

        let response;
        
        if (name === "ASK_QUESTION" || name === "CREATE_PLAN") {
          const question = `\n\n${name === "ASK_QUESTION" 
            ? `kindly answer these questions\n\n ${toolToCall.args.questions.map((ques, idx) => `${idx + 1}. ${ques}\n`).join("")}\n\n` 
            : `kindly approve the plan or let us know the issues with the plan\n\n ${`- summary: ${toolToCall.args.summary} \n\n - actionable points: \n${toolToCall.args.plan.map((pl, idx) => `${idx + 1}. ${pl}\n`).join("")}`}`}\n\n`;
          
          const answer = await askQuestion(question);
          
          if (!answer) {
            throw new Error("tool interrupted")
          }
          
          response = answer;
        } else if (name === "BASH") {
          const question = `\n\nAGENT wants to run a bash command \n\n - purpose: ${toolToCall.args.purpose} \n - command: ${toolToCall.args.command} \n\n Y/N ??`;
          
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
            const fn = TOOL_IMPLEMENTATIONS[name];
            response = await fn({ command: args.command, projectPath });
          }
        } else if (name === "SAVE_MEMORY" || name === "DELETE_MEMORY" || name === "GET_MEMORY") {
          const fn = TOOL_IMPLEMENTATIONS[name];
          response = await fn(args);
        }
        
        sessionMessages.gemini.push({
          parts: [{
            functionCall: {
              name: name,
              id: id,
              args: args
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
        
        sessionMessages.gemini.push({
          role: "user",
          parts: [{
            functionResponse: {
              name: name,
              response: { response: name === "BASH" ? truncateResult(response) : response },
            },
            thoughtSignature
          }]
        });

        sessionMessages.openai.push({
          role: "user",
          content: `
            <TOOL_RESPONSE>
              ${name === "BASH" ? JSON.stringify(truncateResult(response)) : JSON.stringify(response)}
            <TOOL_RESPONSE>
          `,
        });
      }
            
      if (!functionCalls) {
        console.log(textResponseAccumulated)
        
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
      
      // STORING MESSAGES (IN_MEMORY)
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
