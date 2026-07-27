import { type FunctionCall, type GenerateContentConfig, type Part } from "@google/genai";

export type GeminiTurn = {
  role: "user" | "model";
  parts: Part[];
};

export type Memory = {
  fact: string[]
}

// sessionId => Messages
export type Messages = Record<string, GeminiTurn[]>;

// projectId (for now path of the project) => memories
export type Memories = Record<string, Memory[]>;

// sessionId => sandboxId
export type Sandboxes = Record<string, string>;

export type GeminiProviderPayload = {
  provider: "gemini",
  payload: {
    model: string,
    contents: GeminiTurn[]
    config?: GenerateContentConfig;
  }
}

export type GeminiProviderResponse = {
  provider: "gemini", 
  payload: {
    totalToken: number,
    toolToCall?: FunctionCall,
    streamingText?: string,
    moreFunctionCall: boolean,
    thoughtSignature?: string
  }
}

export type OpenaiProviderResponse = {
  provider: "openai", 
  payload: {
    idk: boolean
  }
}

export type MultiProvidersPayload = GeminiProviderPayload

export type MultiProvidersResponse = GeminiProviderResponse | OpenaiProviderResponse
