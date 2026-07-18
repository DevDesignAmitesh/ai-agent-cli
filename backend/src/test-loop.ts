import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

function askQuestion(question: string) {
  return new Promise<string>((res) => {
    rl.question(question, (input) => {
      res(input)
    });
  }) 
}

const tool = "ASK"
const question1 = "how can i help you? "
const question2 = "choco? "


async function main() {
  while (1) {
    const answer1 = await askQuestion(question1);
    
    process.stdout.write("THINKING\n")
    process.stdout.write("CALLING TOOL\n")
    
    if (tool === "ASK") {
      const answer2 = await askQuestion(question2);
      
    } else {
      process.stdout.write(`ANSWER: ${answer1}\n`)
    }
   
  }
}

main();
