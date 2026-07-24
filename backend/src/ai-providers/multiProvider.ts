import type { MultiProvidersPayload, MultiProvidersResponse } from "../types";
import { geminiIntegration } from "./gemini/intergration";

export async function multiProvider(data :MultiProvidersPayload): Promise<MultiProvidersResponse> {
  let dataToSend: MultiProvidersResponse;
  
  switch(data.provider) {
    case "gemini":
      dataToSend = await geminiIntegration(data);
      break;  
  }

  return dataToSend;
}
