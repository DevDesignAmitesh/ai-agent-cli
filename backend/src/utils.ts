import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import type { GeminiTurn } from './types';
import { GoogleGenAI } from "@google/genai";
import { SUMMARIZING_PROMPT } from './prompts/summarize-prompt';

const rl = readline.createInterface({ input, output });

export function askQuestion(question: string) {
  return new Promise<string>((res) => {
    rl.question(question, (input) => {
      res(input)
    });
  }) 
}

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function getSummary(aiResponse: GeminiTurn[]): Promise<GeminiTurn[]> {
  
  const res = await client.models.generateContent({
    contents: aiResponse,
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
  
  return [{
    parts: [
      { 
        text: res?.candidates?.[0]?.content?.parts?.[0]?.text, 
        thoughtSignature
      }
    ],
    role: "model"
  }]
}


// mainly for bash tool
export function truncateResult({ stdout, stderr }: {
    stdout: string;
    stderr: string;
}) {
  let result;
  
  if (stderr !== "") {
    result = stderr
  } else {
    result = stdout
  }
  
  const MAX_RESULT_LENGTH_ALLOWED = 3000;
  
  if (result.length <= MAX_RESULT_LENGTH_ALLOWED) return result;

  const kept = result.slice(0, MAX_RESULT_LENGTH_ALLOWED);
  const remaining = result.length - MAX_RESULT_LENGTH_ALLOWED;

  return `${kept}\n\n[...truncated, ${remaining} more characters. Narrow your command (e.g. head/grep) if you need the rest.]`;
}

