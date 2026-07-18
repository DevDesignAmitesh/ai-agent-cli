import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { agentLoop } from './agent-loop.';
import type { AiResponse } from './types';

const rl = readline.createInterface({ input, output });
let firstTimeLoop = true;
const aiResponse: AiResponse[] = []; 
let interaction_id: string | undefined = undefined;


function main(firstTime: boolean) {
  rl.question(firstTime ? 'Hey, How can I help you? ' : "Any follow up? Type NO to quit.", async (input) => {  
  
    if (!input) throw new Error("input not provided");
    
    if (input === "NO") {
      rl.close();
    } else {
      await agentLoop(input, aiResponse, interaction_id)
      firstTimeLoop = false
      main(firstTimeLoop)
    }
    
  });
}

main(firstTimeLoop);
