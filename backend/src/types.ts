import { type GenerateContentConfig, type Part } from "@google/genai";

export type FunctionCall =  {
    /** Optional. The unique id of the function call. If populated, the client to execute the `function_call` and return the response with the matching `id`. */
    id?: string;
    /** Optional. The function parameters and values in JSON object format. See FunctionDeclaration.parameters for parameter details. */
    args?: Record<string, unknown>;
    /** Optional. The name of the function to call. Matches FunctionDeclaration.name. */
    name?: string;
}

export interface FunctionTool {
  name: string;

  parameters: { [key: string]: unknown } | null;

  strict: boolean | null;

  type: 'function';

  // can remove too
  defer_loading?: boolean;

  description?: string | null;
}

export type providers = "gemini" | "openai";

export type GeminiTurn = {
  role: "user" | "model";
  parts: Part[];
};

export type OpenaiTurn = {
  role: "user" | "system";
  content: string;
};

export type Memory = {
  fact: string[]
}

export type MessageType = {
  gemini: GeminiTurn[]
  openai: OpenaiTurn[]
}

// sessionId => Messages
export type Messages = Record<string, MessageType>;

// projectId (for now path of the project) => memories
export type Memories = Record<string, Memory[]>;

export type GeminiProviderPayload = {
  provider: "gemini",
  model: string,
  contents: GeminiTurn[]
  config?: GenerateContentConfig;
}

export type OpenAiProviderPayload = {
  provider: "openai",
  model: string
  input: OpenaiTurn[]
  tools: FunctionTool[]
}

export type GeminiProviderResponse = {
  provider: "gemini", 
  totalToken: number,
  toolToCall?: FunctionCall,
  streamingText?: string,
  moreFunctionCall: boolean,
  thoughtSignature?: string
}

export type OpenaiProviderResponse = {
  provider: "openai", 
  some_payload: boolean
}

export type MultiProvidersPayload = GeminiProviderPayload | OpenAiProviderPayload

// export type MultiProvidersResponse = GeminiProviderResponse | OpenaiProviderResponse
export type MultiProvidersResponse = {
  totalToken: number,
  toolToCall?: FunctionCall,
  streamingText?: string,
  moreFunctionCall: boolean,
  thoughtSignature?: string
}
