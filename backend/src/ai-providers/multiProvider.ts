import type { MultiProvidersPayload, MultiProvidersResponse } from "../types";
import { geminiIntegration } from "./gemini/intergration";
import { openaiIntegration } from "./openai/integration";

export async function multiProvider(data: MultiProvidersPayload): Promise<MultiProvidersResponse | null> {
  let dataToSend: MultiProvidersResponse | null;
  
  switch(data.provider) {
    case "gemini":
      dataToSend = await geminiIntegration(data);
      break;  
    case "openai":
      dataToSend = await openaiIntegration(data);
      break;  
    default:
      dataToSend = null;
      break;
  }

  return dataToSend;
}
