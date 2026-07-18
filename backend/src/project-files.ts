import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
export const projectRoot = path.resolve(currentDirectory, "../../template");

const TIME_OUT = 10 * 1000;

export async function bash({ command }: { command: string }) {
  return new Promise<{ stdout: string; stderr: string } | undefined>((resolve) => {
    
    process.chdir(projectRoot);
    const child = spawn("wsl", ["bash", "-lc", command]);
    
    const timeout = setTimeout(() => {
      child.kill();
      resolve(undefined)
    }, TIME_OUT);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

    child.on("close", () => {
      clearTimeout(timeout);
      resolve({ stdout, stderr })
    });
  });
}

// for testing
// console.log(await bash({ command: "time sleep 14" }));
