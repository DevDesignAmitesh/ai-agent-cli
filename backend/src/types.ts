import { type Part } from "@google/genai";

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

