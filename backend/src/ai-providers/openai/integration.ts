import type { FunctionCall, MultiProvidersPayload, MultiProvidersResponse } from "../../types";
import { OpenAI } from "openai";
import { wrapOpenAI, init, flush, shutdown,  } from "neatlogs";

export async function openaiIntegration(data: MultiProvidersPayload): Promise<MultiProvidersResponse> {  
  if (data.provider !== "openai") throw new Error("satisfying TS");
  
  let moreFunctionCall: boolean = false;
  let streamingText: string = "";
  let totalToken: number = 0;
  let toolToCall: FunctionCall | undefined;
  
  const { input, model, tools } = data;
  
  const openai = wrapOpenAI(new OpenAI());
  
  const stream = await openai.responses.create({ input, model, tools, stream: true });

  for await (const event of stream) {
    if (event.type === "response.output_text.delta") {
      streamingText += event.delta;
    } else if (event.type === "response.output_item.done") {
      if (event.item.type === "function_call") {
        console.log("ARGS IN OPENAI", event.item.arguments)
        moreFunctionCall = true;
        toolToCall = {
          args: JSON.parse(event.item.arguments),
          id: event.item.id,
          name: event.item.name
        }
      }
    }
  }

  // await flush();
  // await shutdown();
  
  return {
    moreFunctionCall,
    totalToken,
    streamingText,
    toolToCall
  }
}