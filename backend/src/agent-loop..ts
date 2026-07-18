import { GoogleGenAI } from "@google/genai";
import { TOOL_IMPLEMENTATIONS, TOOLS } from "./tools";
import { SYSTEM_PROMPT } from "./system-prompt";
import { type AiResponse } from "./types";

const MAX_STEPS = 10;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("process.env.GEMINI_API_KEY not found")
}

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export async function agentLoop(input: string, aiResponse: AiResponse[]) {
  try {
    let steps = 0;

    aiResponse.push({
      type: "user_input",
      content: [{ text: input, type: "text" }]
    })
    
    
    while (1) {
      steps++;
            
      if (steps > MAX_STEPS) {
        throw new Error("MAX_STEPS reached");
      }

      let funcCallId = null;
      let funcCallName = null;
      let funcArgsAccumulated = "";
      let textResponseAccumulated = "";
      
      let stream; 
      
      try {
        stream = await client.interactions.create({
          model: "gemini-3.5-flash",
          tools: TOOLS,
          store: false,
          input: aiResponse,
          stream: true,
          system_instruction: SYSTEM_PROMPT,
        });
      } catch (e) {
        console.log("API ERROR", e);
        throw new Error("API ERROR")
      }
      
      
      for await (const event of stream) {
        if (event.event_type === "interaction.created") {
        } else if (event.event_type === "step.start") {
            const step = event.step;
          if (step.type === "function_call") {
            funcCallId = step.id;
            funcCallName = step.name;
          }
        } else if (event.event_type === "step.delta") {
          if (event.delta.type === "arguments_delta") {
            funcArgsAccumulated += event.delta.arguments;
          } else  if (event.delta.type === "text") {
            textResponseAccumulated += event.delta.text;
          }
        }
      }
      
      if (funcCallId && funcCallName) {
        try {
          console.log("calling", funcCallName)
          console.log("args", funcArgsAccumulated)
          
          const fn = TOOL_IMPLEMENTATIONS[funcCallName];
          const response = await fn(JSON.parse(funcArgsAccumulated))

          aiResponse.push({
            call_id: funcCallId,
            name: funcCallName,
            result: JSON.stringify(response),
            type: "function_result"
          })
        } catch (err) {
          console.log(err)
          throw new Error("UNABLE TO PARSE ARGUMENTS");
        }
      } else {
        aiResponse.push({
          content: [{ type: "text", text: textResponseAccumulated }],
          type: "model_output"
        })
        console.log(textResponseAccumulated)
        break;
      }
    } 
  } catch (err) {
    console.log("ERROR", err.message);
  }
}