import { GoogleGenAI, } from "@google/genai";
import type { FunctionCall, MultiProvidersPayload, MultiProvidersResponse } from "../../types";


export async function geminiIntegration(data: MultiProvidersPayload): Promise<MultiProvidersResponse> {  
  if (data.provider !== "gemini") throw new Error("satisfying TS");
  
  const { contents, model, config }= data;
  
  const client = new GoogleGenAI({});
  
  const stream = await client.models.generateContentStream({
    contents, 
    model, 
    config
  });
  
  let totalToken = 0;
  let toolToCall: FunctionCall | undefined;
  let streamingText: string | undefined;
  let moreFunctionCall: boolean = false;
  let thoughtSignature: string | undefined;
  
  for await (const event of stream) {
    thoughtSignature = event?.candidates?.[0]?.content?.parts?.[0]?.thoughtSignature

    if (event.usageMetadata && typeof event.usageMetadata.totalTokenCount === "number") {
      totalToken += event.usageMetadata?.totalTokenCount
    }
    
    if (event?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
      toolToCall = event?.candidates?.[0]?.content?.parts?.[0]?.functionCall;                
      moreFunctionCall = true;
    } else if (!moreFunctionCall && typeof event?.candidates?.[0]?.content?.parts?.[0]?.text === "string" && !event?.candidates?.[0]?.content?.parts?.[0]?.text.includes("non-text")) {
      streamingText += event?.candidates?.[0]?.content?.parts?.[0]?.text
    }
  }
  
  return {
    // provider: "gemini",
    moreFunctionCall,
    streamingText,
    toolToCall,
    totalToken,
    thoughtSignature
  }
  
}