import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
export const projectRoot = path.resolve(currentDirectory, "../../template");


export async function bash({ command }: { command: string }) {
  return new Promise<{ stdout: string; stderr: string }>((resolve) => {
    process.chdir(projectRoot);
    const child = spawn("wsl", ["bash", "-lc", command]);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

    child.on("close", () => resolve({ stdout, stderr }));
  });
}