import { sessionManager } from "../manager/session.manager";
import { askQuestion } from "./tool.utils";

export async function getSessionId() {
  let sessionId = null;
  let projectDir = null;
  const answer = await askQuestion("\n\nProvide previous SESSION_ID else press enter. ");
  
  if (!answer) {
    projectDir = (await askQuestion("\n\nPlease provide the path of the repo you want to work on. ")).trim();
    
    if (!projectDir) {
      process.exit(1)
    }
    
    if (projectDir === ".") projectDir = process.cwd();
    
    sessionId = crypto.randomUUID();
    sessionManager.setSessionMsg(sessionId, []);
    sessionManager.storeAllMessages()
  } else {
    sessionId = answer.trim();
  }
  
  return { sessionId, projectDir };
}


