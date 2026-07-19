import { askQuestion } from "./tool.utils";

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


