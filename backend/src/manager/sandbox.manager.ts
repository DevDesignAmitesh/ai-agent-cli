import type { Sandboxes } from "../types";
import { SANDBOX_PATH } from "../utils/tool.utils";
import fs from "fs";
import { Sandbox } from "e2b";
import path from "path";

const files_to_ignore = [".git", "node_modules", ".qodo", "dist"];

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
    this.storeAllSanboxes();
  }
  
  getOrCreateSandboxId(sessionId: string): string | undefined {
    return this.sbx[sessionId];
  }
  
  getSandbox = async (sessionId: string): Promise<Sandbox> => {
    const existingId = this.getOrCreateSandboxId(sessionId);
    
    if (existingId) {
      console.log("returning existing sanbox");
      return await Sandbox.connect(existingId);
    }

    const sandbox = await Sandbox.create({
      lifecycle: {
        onTimeout: "pause"
      }
    });
    this.setSandbox(sessionId, sandbox.sandboxId);        
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
        console.log(`Uploaded: ${sandboxPath} To Sanbox`);
      }
    }
  }
  
  saveDirectoryLocally = async (sessionId: string, localDir: string, sandboxDir: string) => {      
    const sbx = await this.getSandbox(sessionId)
    const files = (await sbx.files.list(sandboxDir)).map((fls) => ({ path: fls.path, type: fls.type }));
    
    console.log(files)
    
    
    // just for testing.
    // const data: Record<string, string> = {};
    
    for (const { path: ph, type } of files) {
      
      const localPath = path.join(localDir, ph.split(sandboxDir)[1]!)
      
      if (type && type === "dir") {
        // Recursively upload subdirectories
        await this.saveDirectoryLocally(sessionId, localDir, ph);
      } else {
        // Read file content and write it directly to the sandbox
        const fileContent = await sbx.files.read(ph);
        // data[localPath] = fileContent
        // fs.writeFileSync("./random.json", JSON.stringify(data));
        fs.writeFileSync(localPath, fileContent);
        console.log(`Uploaded: ${localPath} To Local`);
      }
    }
  }
};

export const sandboxManager = SandboxManager.getInstance();
