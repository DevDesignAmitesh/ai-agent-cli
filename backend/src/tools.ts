import { memoryManager } from "./manager/memory.manager";
import { bash, projectRoot } from "./utils/tool.utils";

export const TOOL_IMPLEMENTATIONS = {
  BASH: bash,
  ASK_QUESTION: async ({
    questions,
  }: {
    questions: string[];
  }) => {
    return questions;
    // return questions.join(", ");
  },
  CREATE_PLAN: async ({
    summary,
    plan,
  }: {
    summary: string;
    plan: string[];
  }) => {
    return { plan, summary }
    // return plan.join(", ");
  },
  SAVE_MEMORY: async ({ fact }: { fact: string[] }) => {
    memoryManager.saveMemory(projectRoot, { fact });
    return "saved"
  }
};
