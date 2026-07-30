import { agentLoop } from './agent-loop';
import { sessionManager } from './manager/session.manager';
import { type Messages } from './types';
import { getSessionId } from './utils/session.utils';
import { askQuestion } from './utils/tool.utils';
import { init, flush, shutdown, span } from 'neatlogs';

let firstTimeLoop = true;

const messages: Messages = sessionManager.getMessages();

console.log("ALL_SESSION_IDs", Object.keys(messages));

const { sessionId } = await getSessionId();

console.log("\nCURRENT_SESSION_ID\n", sessionId);

await init({ apiKey: process.env.NEATLOGS_API_KEY, workflowName: 'ai-agent-cli' });

async function main(firstTime: boolean) {
  return new Promise<void | string>(async (res, rej) => {
    let isThereFileChanges = false;
    const answer = await askQuestion(firstTime ? "How can i help you? " : "Any follow up? ");
      
    if (answer.trim().toLowerCase() === "no") {      
      res();
    }
      
    const runAgentLoop = span({ kind: 'WORKFLOW', name: 'my_agent_loop' }, async (initialQuery: string) => {
      return await agentLoop(initialQuery, sessionId, isThereFileChanges, "openai");
    });
    
    const agentLoopResponse = await runAgentLoop(answer);
  
    if (!agentLoopResponse.success) console.log("Something went wrong with that turn - try again.");
  
    firstTimeLoop = false;
    main(firstTimeLoop)
  })
};

main(firstTimeLoop)
  .then(async () => {
    await flush();
    await shutdown();
  })
  .catch(async () => {
    await flush();
    await shutdown();
  })
