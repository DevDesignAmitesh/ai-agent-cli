import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

export function askQuestion(question: string) {
  return new Promise<string>((res) => {
    rl.question(question, (input) => {
      res(input)
    });
  }) 
}



// mainly for bash tool
export function truncateResult({ stdout, stderr }: {
    stdout: string;
    stderr: string;
}) {
  let result;
  
  if (stderr !== "") {
    result = stderr
  } else {
    result = stdout
  }
  
  const MAX_RESULT_LENGTH_ALLOWED = 3000;
  
  if (result.length <= MAX_RESULT_LENGTH_ALLOWED) return result;

  const kept = result.slice(0, MAX_RESULT_LENGTH_ALLOWED);
  const remaining = result.length - MAX_RESULT_LENGTH_ALLOWED;

  return `${kept}\n\n[...truncated, ${remaining} more characters. Narrow your command (e.g. head/grep) if you need the rest.]`;
}