import { memoryManager } from "./manager/memory.manager";
import type { ToolNames } from "./types";
import { bash } from "./utils/tool.utils";

export const TOOL_IMPLEMENTATIONS: Record<ToolNames, any> = {
  BASH: bash,
  
  // not getting used (here just for satisfying ts)
  ASK_QUESTION: async ({
    questions,
  }: {
    questions: string[];
  }) => {
    return questions;
  },
  
  // not getting used (here just for satisfying ts)
  CREATE_PLAN: async ({
    summary,
    plan,
  }: {
    summary: string;
    plan: string[];
  }) => {
    return { plan, summary }
  },

  SAVE_MEMORY: async ({ projectPath, fact }: { projectPath: string, fact: string }) => {
    const id = crypto.randomUUID();
    
    memoryManager.saveMemory(projectPath, { id, fact });
    return `saved memory in the projectPath: ${projectPath} with the id: ${id} and fact: ${fact}`
  },
  
  GET_MEMORY: async ({ projectPath }: { projectPath: string }) => {
    return memoryManager.getMemories(projectPath);
  },

  DELETE_MEMORY: async ({ projectPath, memoryIdToDelete }: { projectPath: string, memoryIdToDelete: string }) => {
    memoryManager.deleteMemories(projectPath, memoryIdToDelete);
    return `deleted memory inside: ${projectPath} with the id: ${memoryIdToDelete}` 
  },
};
