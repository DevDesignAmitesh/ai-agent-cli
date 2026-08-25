import { agentLoop } from './agent-loop';
import { sessionManager } from './manager/session.manager';
import { getSessionId } from './utils/session.utils';
import { askQuestion, projectRoot } from './utils/tool.utils';

let firstTimeLoop = true;

const sessionIds = sessionManager.getSessionIds();

console.log("ALL SESSIONS");
console.log(sessionIds.map((id, idx) => `${idx}. ${id}\n`).join(""))

const { sessionId } = await getSessionId();

const projectPath = projectRoot;

async function main(firstTime: boolean) {
  const answer = await askQuestion(firstTime ? "How can i help you? " : "Any follow up? ");
    
  if (answer.trim().toLowerCase() === "no") {
    process.exit(0)
  }
    
  const agentLoopResponse = await agentLoop(answer, sessionId, "openai", projectPath);
  
  if (!agentLoopResponse.success) console.log("Something went wrong with that turn - try again.");

  firstTimeLoop = false;
  main(firstTimeLoop)
};

main(firstTimeLoop);
