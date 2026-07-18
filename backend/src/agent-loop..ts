import { GoogleGenAI } from "@google/genai";
import { TOOL_IMPLEMENTATIONS, TOOLS } from "./tools";
import { SYSTEM_PROMPT } from "./system-prompt";
import { type AiResponse } from "./types";

const MAX_STEPS = 20;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("process.env.GEMINI_API_KEY not found")
}

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function agentLoop(input: string, aiResponse: AiResponse[], interaction_id: string | undefined) {
  try {
    console.log("RUNNING 1");
    let steps = 0;

    aiResponse.push({
      type: "user_input",
      content: [{ text: input, type: "text" }]
    })
    
    
    while (true) {
      steps++;
      console.log("STEPS", steps);
      // if (steps > MAX_STEPS) {
      //   throw new Error("MAX_STEPS reached");
      // }

      let funcCallId = null;
      let funcCallName = null;
      let funcArgsAccumulated = "";
      let textResponseAccumulated = "";
      let stream; 
      
      console.log("typeof interaction_id", typeof interaction_id);
      
      console.log("RUNNING 2");
      try {
        stream = await client.interactions.create({
          model: "gemini-3.5-flash",
          tools: TOOLS,
          store: true,
          previous_interaction_id: interaction_id,
          input: aiResponse,
          stream: true,
          system_instruction: SYSTEM_PROMPT,
        });
      } catch (e) {
        console.log("API ERROR", e);
        throw new Error("API ERROR")
      }
            
      // console.dir(aiResponse, { depth: null })
      
      for await (const event of stream) {
        console.log("RUNNING 3");
        if (event.event_type === "interaction.created") {
          interaction_id = event.interaction.id
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
        console.log("RUNNING 4");
        try {
          console.log("calling", funcCallName)
          console.log("args", funcArgsAccumulated)
          
          let keyValues: Record<string, unknown> = JSON.parse(funcArgsAccumulated);
          
          for (const [key, val] of Object.entries(keyValues)) {
            keyValues[key] = JSON.stringify(val)
          }
          
          // console.log("KEY VALUES", keyValues);
          
          // aiResponse.push({
          //   id: funcCallId,
          //   name: funcCallName,
          //   arguments: keyValues,
          //   type: "function_call"
          // });

          const fn = TOOL_IMPLEMENTATIONS[funcCallName];
          const response = await fn(JSON.parse(funcArgsAccumulated))

          // console.log("RESPONSE", response);
          
          aiResponse.push({
            call_id: funcCallId,
            name: funcCallName,
            result: response,
            type: "function_result"
          });
        } catch (err) {
          console.log(err)
          throw new Error("UNABLE TO PARSE ARGUMENTS");
        }
      } else {
        console.log("RUNNING 5");
        aiResponse.push({
          content: [{ type: "text", text: textResponseAccumulated }],
          type: "model_output"
        })
        console.log(textResponseAccumulated)
        break;
      }
    }
  } catch (err) {
    console.log("RUNNING 6");
    console.log("ERROR", err.message);
  }
}