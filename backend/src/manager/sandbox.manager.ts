import type { Sandboxes } from "../types";
import { projectRoot, sanboxRoot, SANDBOX_PATH } from "../utils/tool.utils";
import fs from "fs";
import { Sandbox } from "e2b";
import path from "path";

const files_to_ignore = [".git", "node_modules", ".qodo","dist"];
const E2B_API_KEY = process.env.E2B_API_KEY;

if (!E2B_API_KEY) throw new Error("E2B_API_KEY not found")

class SandboxManager {
  private static instance: SandboxManager;
  private sbx: Sandboxes
  
  constructor() {
    this.sbx = this.getAllSanboxes();
  }
  
  static getInstance(): SandboxManager {
    if (!SandboxManager.instance) SandboxManager.instance = new SandboxManager();
    return SandboxManager.instance
  }

  private getAllSanboxes() {
    try {
      return JSON.parse(fs.readFileSync(SANDBOX_PATH).toString())
    } catch (e) {
      return {}
    }
  }

  private storeAllSanboxes() {
    fs.writeFileSync(SANDBOX_PATH, JSON.stringify(this.sbx))
  }
  
  setSandbox(sessionId: string, sandboxId: string) {
    this.sbx[sessionId] = sandboxId;
  }
  
  getOrCreateSandboxId(sessionId: string): string | undefined {
    return this.sbx[sessionId];
  }
  
  getSandbox = async (sessionId: string): Promise<Sandbox> => {
    const existingId = this.getOrCreateSandboxId(sessionId);
    
    if (existingId) {
      return await Sandbox.connect(existingId, {
        apiKey: E2B_API_KEY
      });
    }

    const sandbox = await Sandbox.create({
      apiKey: E2B_API_KEY,
      lifecycle: {
        onTimeout: "pause"
      }
    });
    this.setSandbox(sessionId, sandbox.sandboxId);
        
    this.uploadDirectory(sessionId, projectRoot, sanboxRoot);
    this.storeAllSanboxes();
    return sandbox;
  }
  
  uploadDirectory = async (sessionId: string, localDir: string, sandboxDir: string) => {      
    const sbx = await this.getSandbox(sessionId)
    const files = fs.readdirSync(localDir);
    
    for (const file of files) {
      if (files_to_ignore.includes(file)) continue;
          
      const localPath = path.join(localDir, file);
      const sandboxPath = path.posix.join(sandboxDir, file);
      
      if (fs.statSync(localPath).isDirectory()) {
        // Recursively upload subdirectories
        await this.uploadDirectory(sessionId, localPath, sandboxPath);
      } else {
        // Read file content and write it directly to the sandbox
        const fileContent = fs.readFileSync(localPath);
        await sbx.files.write(sandboxPath, fileContent.toString());
        console.log(`Uploaded: ${sandboxPath}`);
      }
    }
  }
};

export const sandboxManager = SandboxManager.getInstance();
