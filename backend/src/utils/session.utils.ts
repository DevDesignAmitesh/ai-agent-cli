import { sandboxManager } from "../manager/sandbox.manager";
import { askQuestion } from "./tool.utils";

export async function getSessionId() {
  let sessionId = null;
  const answer = await askQuestion("\n\nProvide previous SESSION_ID else press enter. ");
    
  if (!answer) {
    sessionId = crypto.randomUUID();
    // await sandboxManager.uploadDirectory(sessionId);
  } else {
    sessionId = answer.trim();
  }
  
  return { sessionId };
}


