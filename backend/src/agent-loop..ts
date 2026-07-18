import { GoogleGenAI } from "@google/genai";
import { TOOL_IMPLEMENTATIONS, TOOLS } from "./tools";
import { SYSTEM_PROMPT } from "./system-prompt";
import { type GeminiTurn } from "./types";
import { askQuestion } from "./utils";

const MAX_STEPS = 10;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("process.env.GEMINI_API_KEY not found")
}

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function agentLoop(input: string, aiResponse: GeminiTurn[], interaction_id: string | undefined) {
  try {
    let steps = 0;

    aiResponse.push({
      role: "user",
      parts: [{ text: input }]
    })
    
    while (true) {
      steps++;

      if (steps > MAX_STEPS) {
        const answer = await askQuestion(
          `Agent has used ${MAX_STEPS} steps without finishing. Continue? (y/n) `
        );
        if (answer.trim().toLowerCase() === "y") {
          steps = 0; // reset budget, keep looping — don't push a new user message
          continue;
        } else {
          break; // stop here, but keep whatever aiResponse has so far
        }
      }
      
      let textResponseAccumulated = "";
      let stream;
      let functionCalls = false;
      
      try {
        stream = await client.models.generateContentStream({
          contents: aiResponse,
          model: "gemini-3.5-flash",
          config: {
            systemInstruction: SYSTEM_PROMPT,
            tools: TOOLS,
          }
          
        });
      } catch (e) {
        console.log("API ERROR", e);
        throw new Error("API ERROR");
      }           

      for await (const event of stream) {
        const thoughtSignature = event?.candidates?.[0]?.content?.parts?.[0]?.thoughtSignature; 
        
        if (event?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
          const toolToCall = event?.candidates?.[0]?.content?.parts?.[0]?.functionCall
                    
          functionCalls = true;

          if (toolToCall.name) {
            if (toolToCall.name === "ASK_QUESTION" || toolToCall.name === "CREATE_PLAN") {            
              aiResponse.push({
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
              const question = `\n\n${toolToCall.name === "ASK_QUESTION" ? `kindly answer these questions\n ${JSON.stringify(toolToCall.args)}\n` : `kindly approve the plan or let us know the issues with the plan\n ${JSON.stringify(toolToCall.args)}`}\n`;
              
              const answer = await askQuestion(question);
              
              // TODO: handle it more gracefully.
              if (!answer) throw new Error("user input not provided");
              
              aiResponse.push({
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
              const question = `AGENT wants to run a bash command \n\n ${JSON.stringify(toolToCall.args, null, 2)} \n\n Y/N ??`;
              
              const answer = await askQuestion(question);

              const approved = answer.trim().toLowerCase() === "y";

              if (!approved) {
                aiResponse.push({
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
                aiResponse.push({
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
                
                aiResponse.push({
                  parts: [{
                    functionResponse: {
                      name: toolToCall.name,
                      id: toolToCall.id,
                      response
                    },
                    thoughtSignature
                  }],
                  role: "model"
                });
              }
            }
          }          
        } else if (!functionCalls && typeof event?.candidates?.[0]?.content?.parts?.[0]?.text === "string" && !event?.candidates?.[0]?.content?.parts?.[0]?.text.includes("non-text")) {
          textResponseAccumulated += event?.candidates?.[0]?.content?.parts?.[0]?.text
          process.stdout.write(textResponseAccumulated);
        } else {
        }
      }

      aiResponse.push({
        role: "model",
        parts: [{ text: textResponseAccumulated }]
      });

      if (!functionCalls) break;
    }
    
    return { aiResponse, interaction_id, success: true }
  } catch (err) {
    console.log("ERROR", err)
    return { aiResponse, interaction_id, success: false }
  }
}