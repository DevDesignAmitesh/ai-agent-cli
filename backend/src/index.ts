import { agentLoop } from './agent-loop.';
import { sessionManager } from './manager/session.manager';
import { type Messages } from './types';
import { getSessionId } from './utils/session.utils';
import { askQuestion } from './utils/tool.utils';

let firstTimeLoop = true;

const messages: Messages = sessionManager.getMessages();

console.log("ALL_SESSION_IDs", Object.keys(messages));

const { sessionId } = await getSessionId();

console.log("\nCURRENT_SESSION_ID\n", sessionId);

async function main(firstTime: boolean) {
  const answer = await askQuestion(firstTime? "How can i help you? " : "Any follow up? ");
    
  console.log("INITIAL_PROMPT", answer);
  
  if (answer.trim().toLowerCase() === "no") process.exit(0);
  
  const res = await agentLoop(answer, sessionId);

  if (!res.success) console.log("Something went wrong with that turn - try again.");

  firstTimeLoop = false;
  main(firstTimeLoop)
};

main(firstTimeLoop);
