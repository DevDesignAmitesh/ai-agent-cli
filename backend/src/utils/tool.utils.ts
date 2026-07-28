import path from "path";
import { fileURLToPath } from "url";
import readline from 'readline';
import { stdin as input, stdout as output } from 'process';
import { spawn } from "child_process";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
export const projectRoot = path.resolve(currentDirectory, "../../../template");
export const MESSAGES_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../messages.json");
export const MEMORY_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../memory.json");

type BashResult = {
  stdout: string;
  stderr: string;
  error?: string;
};

export async function bash({
  command,
}: {
  command: string;
}) {
  return new Promise<{ stdout: string; stderr: string }>((resolve) => {
    const child = spawn("wsl", ["bash", "-lc", command], { cwd: projectRoot });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

    child.on("close", () => resolve({ stdout, stderr }));
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



const MAX_RESULT_LENGTH_ALLOWED = 3000;

function truncate(text: string): string {
  if (text.length <= MAX_RESULT_LENGTH_ALLOWED) {
    return text;
  }

  const kept = text.slice(0, MAX_RESULT_LENGTH_ALLOWED);
  const remaining = text.length - MAX_RESULT_LENGTH_ALLOWED;

  return `${kept} [...truncated, ${remaining} more characters. Narrow your command (e.g. head/grep) if you need the rest.]`;
}

export function truncateResult({
  stdout = "",
  stderr = "",
}: Partial<BashResult>) {
  // Usually stderr should be prioritized if an error occurred
  if (stderr) {
    return {
      stdout: "",
      stderr: truncate(stderr),
    };
  }

  return {
    stdout: truncate(stdout),
    stderr: "",
  };
}