import { type Part } from "@google/genai";

export type GeminiTurn = {
  role: "user" | "model";
  parts: Part[];
};

export type Messages = Record<string, GeminiTurn[]>;
