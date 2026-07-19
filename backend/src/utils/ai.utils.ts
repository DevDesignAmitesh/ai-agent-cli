import { GoogleGenAI } from "@google/genai";
import type { GeminiTurn } from "../types";
import { SUMMARIZING_PROMPT } from "../prompts/summarize-prompt";

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const MAX_SESSION_MESSAGES = 20;

export async function getSummary(sessionMessages: GeminiTurn[]): Promise<GeminiTurn[]> {
  
  const res = await client.models.generateContent({
    contents: sessionMessages,
    model: "gemini-3.5-flash",
    config: {
      systemInstruction: SUMMARIZING_PROMPT,
      responseMimeType: "application/json",

      responseSchema: {
        type: "object",

        properties: {
          summary: {
            type: "string",
            description: "A concise summary of the conversation so far"
          },

          keyPoints: {
            type: "array",
            description: "Important facts, decisions, and context from the conversation",
            items: {
              type: "string"
            }
          },

          currentTask: {
            type: "string",
            description: "The task or problem the user is currently working on"
          }
        },

        required: [
          "summary",
          "keyPoints",
          "currentTask"
        ]
      }
    }    
  });
  
  const thoughtSignature = res?.candidates?.[0]?.content?.parts?.[0]?.thoughtSignature;
  
  // keep the last three messages 
  // we are not doing this because it messes up the TURN thing which is required in GEMINI
  // like after functionCall there should be functioResponse but if we are removing then its messing up
  // sessionMessages.splice(0, sessionMessages.length - 3);

  return [{
    parts: [
      { 
        text: res?.candidates?.[0]?.content?.parts?.[0]?.text, 
        thoughtSignature
      }
    ],
    role: "model"
  }];
}



