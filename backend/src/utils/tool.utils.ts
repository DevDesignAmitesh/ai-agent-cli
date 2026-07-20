import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
export const projectRoot = path.resolve(currentDirectory, "../../../template");
export const MESSAGES_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../messages.json");
export const MEMORY_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../memory.json");

const TIME_OUT = 10 * 1000;

export async function bash({ command }: { command: string }) {
  return new Promise<{ stdout: string; stderr: string } | undefined>((resolve) => {
    const child = spawn("wsl", ["bash", "-lc", command], { cwd: projectRoot });
    
    const timeout = setTimeout(() => {
      child.kill();
      resolve(undefined)
    }, TIME_OUT);
    
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

    child.on("close", () => {
      resolve({ stdout, stderr })
      clearTimeout(timeout);
    });
  });
}

// for testing
// console.log(await bash({ command: "bun add tailwindcss @tailwindcss/vite lucide-react" }));

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
  
  let result_one = ""
  let result_two = ""
  
  if (stderr !== "") {
    const MAX_RESULT_LENGTH_ALLOWED = 3000;
    
    if (stderr.length <= MAX_RESULT_LENGTH_ALLOWED) return stderr;
  
    const kept = stderr.slice(0, MAX_RESULT_LENGTH_ALLOWED);
    const remaining = stderr.length - MAX_RESULT_LENGTH_ALLOWED;
    result_one = `${kept}\n\n[...truncated, ${remaining} more characters. Narrow your command (e.g. head/grep) if you need the rest.]`;
  } else {
    const MAX_RESULT_LENGTH_ALLOWED = 3000;
    
    if (stdout.length <= MAX_RESULT_LENGTH_ALLOWED) return stdout;
  
    const kept = stdout.slice(0, MAX_RESULT_LENGTH_ALLOWED);
    const remaining = stdout.length - MAX_RESULT_LENGTH_ALLOWED;
    result_two = `${kept}\n\n[...truncated, ${remaining} more characters. Narrow your command (e.g. head/grep) if you need the rest.]`;
  }
  
  return {
    stdout: result_one,
    stderr: result_two,
  }
}