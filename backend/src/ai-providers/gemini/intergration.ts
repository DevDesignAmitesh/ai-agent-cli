import { GoogleGenAI, type FunctionCall } from "@google/genai";
import type { MultiProvidersPayload, MultiProvidersResponse } from "../../types";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("process.env.GEMINI_API_KEY not found")
}


const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function geminiIntegration(data: MultiProvidersPayload): Promise<MultiProvidersResponse> {  
  const stream = await client.models.generateContentStream(data.payload);
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
    provider: "gemini",
    payload: {
      moreFunctionCall,
      streamingText,
      toolToCall,
      totalToken,
      thoughtSignature
    }
  }
  
}