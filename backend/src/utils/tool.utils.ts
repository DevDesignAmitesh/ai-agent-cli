import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
export const projectRoot = path.resolve(currentDirectory, "../../../template");
export const MESSAGES_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../messages.json");

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
// console.log(await bash({ command: "pwd" }));

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