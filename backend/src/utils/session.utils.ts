import fs from "fs";
import { askQuestion } from "./tool.utils";

export function getStoredMessages() {
  try {
    return JSON.parse(fs.readFileSync("../backend/src/messages.json").toString())
  } catch (e) {
    console.log("read file error", e)
    return {}
  }
}

export async function getSessionId() {
  let sessionId = null;
  const answer = await askQuestion("\n\nProvide previous SESSION_ID else press enter. ");
    
  if (!answer) {
    sessionId = crypto.randomUUID();
  } else {
    sessionId = answer.trim();
  }
  
  return { sessionId };
}


