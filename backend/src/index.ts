import { agentLoop } from './agent-loop.';
import { type GeminiTurn } from './types';
import { askQuestion } from './utils';

let firstTimeLoop = true;
const aiResponse: GeminiTurn[] = [];
let interaction_id: string | undefined = undefined;


async function main(firstTime: boolean, aiResponse: GeminiTurn[], interaction_id: string | undefined) {
  const answer = await askQuestion(firstTime? "How can i help you? " : "Any follow up? ");
  
  if (answer === "no") process.exit(0)
  
  const res = await agentLoop(answer, aiResponse, interaction_id)

  if (!res.success) process.exit(1);

  firstTimeLoop = false
  main(firstTimeLoop, res.aiResponse, res.interaction_id)
}

main(firstTimeLoop, aiResponse, interaction_id);

