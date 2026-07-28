import { GoogleGenAI } from "@google/genai";
import { OpenAI } from "openai";
import { ConversationSummarySchema, type MessageType, type providers } from "../types";
import { SUMMARIZING_PROMPT } from "../prompts/summarize-prompt";
import { zodTextFormat } from "openai/helpers/zod";

const openai = new OpenAI();
const client = new GoogleGenAI({});

export const MAX_SESSION_MESSAGES = 30;

export async function getSummary(sessionMessages: MessageType, userSpecifiedProvider: providers): Promise<MessageType> {
  
  if (userSpecifiedProvider === "gemini") {
    const res = await client.models.generateContent({
      contents: sessionMessages.gemini,
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
    
    return {
      gemini: [{
        parts: [
          { 
            text: res?.candidates?.[0]?.content?.parts?.[0]?.text, 
            thoughtSignature
          }
        ],
        role: "model"
      }],
      openai: [{
        content: res?.candidates?.[0]?.content?.parts?.[0]?.text,
        role: "system"
      }]
    };
  } else if (userSpecifiedProvider === "openai") {
    const res = await openai.responses.parse({ 
      input: [
        {
          role: "system",
          content: SUMMARIZING_PROMPT
        },
        ...sessionMessages.openai
      ], 
      model: "gpt-5.6", 
      text: {
        format: zodTextFormat(
          ConversationSummarySchema,
          "conversation_summary"
        ),
      },
    });

    return {
      gemini: [
        {
          parts: [{ text: JSON.stringify(res.output_parsed) }],
          role: "model",
        }
      ],
      openai: [{
        role: "system",
        content: JSON.stringify(res.output_parsed)
      }]
    }
  } else {
    return {
      gemini: [],
      openai: []
    }
  }
};

