import { agentLoop } from './agent-loop';
import { getSessionId } from './utils/session.utils';
import { askQuestion } from './utils/tool.utils';

let firstTimeLoop = true;

const { sessionId } = await getSessionId();

async function main(firstTime: boolean) {
  let isThereFileChanges = false;
  const answer = await askQuestion(firstTime ? "How can i help you? " : "Any follow up? ");
    
  if (answer.trim().toLowerCase() === "no") {
    process.exit(0)
  }
    
  const agentLoopResponse = await agentLoop(answer, sessionId, "openai");
  
  if (!agentLoopResponse.success) console.log("Something went wrong with that turn - try again.");

  firstTimeLoop = false;
  main(firstTimeLoop)
};

main(firstTimeLoop);
