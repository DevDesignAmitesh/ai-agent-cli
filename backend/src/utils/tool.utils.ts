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

type BashResult = {
  stdout: string;
  stderr: string;
  error?: string;
};

export async function bash({
  command,
  sessionId,
}: {
  command: string;
  sessionId: string;
}): Promise<BashResult> {
  try {
    const sandbox = await sandboxManager.getSandbox(sessionId);

    const { stderr = "", stdout = "" } = await sandbox.commands.run(command, {
      cwd: sanboxRoot,
      timeoutMs: TIME_OUT,
    });

    return {
      stdout,
      stderr,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error while executing command";

    console.error("Bash execution failed:", error);

    return {
      stdout: "",
      stderr: message,
      error: message,
    };
  }
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