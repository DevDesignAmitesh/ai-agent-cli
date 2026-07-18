import { type Part } from "@google/genai";

export type GeminiTurn = {
  role: "user" | "model";
  parts: Part[];
};
