import type { Memories, Memory } from "../types";
import fs from "fs";
import { MEMORY_PATH } from "../utils/tool.utils";

class MemoryManager {
  private static instance: MemoryManager;
  private memory: Memories;
  
  constructor() {
    this.memory = this.getStoredMemories();
  }
  
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) MemoryManager.instance = new MemoryManager();
    return MemoryManager.instance
  }

  getStoredMemories() {
    try {
      return JSON.parse(fs.readFileSync(MEMORY_PATH).toString())
    } catch (e) {
      return {}
    }
  }

  saveMemory(key: string, memory: Memory) {
    if (this.memory[key]) {
      this.memory[key].push(memory);
    } else {
      this.memory[key] = [memory];
    }
    
    this.saveAllMemory()
  }

  getMemory(key: string) {
    return this.memory[key] ?? []
  }

  saveAllMemory() {
    fs.writeFileSync(MEMORY_PATH, JSON.stringify(this.memory))
  }
}

export const memoryManager = MemoryManager.getInstance();
