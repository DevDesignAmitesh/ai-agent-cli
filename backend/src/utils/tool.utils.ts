import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { sandboxManager } from "../manager/sandbox.manager";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
export const projectRoot = path.resolve(currentDirectory, "../../../template");
export const sanboxRoot = "/home/user/template";
export const MESSAGES_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../messages.json");
export const MEMORY_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../memory.json");
export const SANDBOX_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../sandbox.json");

const TIME_OUT = 60_1000;

export async function bash({ command, sessionId }: { command: string, sessionId: string }) {
  // running in sanbox;
  const sandbox = await sandboxManager.getSandbox(sessionId);
  
  const { stderr, stdout } = await sandbox.commands.run(command, {
    cwd: sanboxRoot,
    timeoutMs: TIME_OUT
  })

  return { stderr, stdout };
  
  // running locally
  // return new Promise<{ stdout: string; stderr: string } | undefined>((resolve) => {
  //   const child = spawn("wsl", ["bash", "-lc", command], { cwd: projectRoot });
    
  //   const timeout = setTimeout(() => {
  //     child.kill();
  //     resolve(undefined)
  //   }, TIME_OUT);
    
  //   let stdout = "";
  //   let stderr = "";

  //   child.stdout.on("data", (d) => (stdout += d));
  //   child.stderr.on("data", (d) => (stderr += d));

  //   child.on("close", () => {
  //     resolve({ stdout, stderr })
  //     clearTimeout(timeout);
  //   });
  // });
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
  
  let stdout_result = ""
  let stderr_result = ""
  
  if (stderr !== "") {
    const MAX_RESULT_LENGTH_ALLOWED = 3000;
    
    if (stderr.length <= MAX_RESULT_LENGTH_ALLOWED) return stderr;
  
    const kept = stderr.slice(0, MAX_RESULT_LENGTH_ALLOWED);
    const remaining = stderr.length - MAX_RESULT_LENGTH_ALLOWED;
    stderr_result = `${kept}\n\n[...truncated, ${remaining} more characters. Narrow your command (e.g. head/grep) if you need the rest.]`;
  } else {
    const MAX_RESULT_LENGTH_ALLOWED = 3000;
    
    if (stdout.length <= MAX_RESULT_LENGTH_ALLOWED) return stdout;
  
    const kept = stdout.slice(0, MAX_RESULT_LENGTH_ALLOWED);
    const remaining = stdout.length - MAX_RESULT_LENGTH_ALLOWED;
    stdout_result = `${kept}\n\n[...truncated, ${remaining} more characters. Narrow your command (e.g. head/grep) if you need the rest.]`;
  }
  
  return {
    stdout: stdout_result,
    stderr: stderr_result,
  }
}