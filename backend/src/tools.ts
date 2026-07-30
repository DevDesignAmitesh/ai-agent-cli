import { span } from "neatlogs";
import { memoryManager } from "./manager/memory.manager";
import { bash, projectRoot } from "./utils/tool.utils";

export const TOOL_IMPLEMENTATIONS = {
  BASH: span({ kind: 'TOOL', toolName: 'BASH' }, bash),
  ASK_QUESTION: span({ kind: 'TOOL', toolName: 'ASK_QUESTION' }, async ({
    questions,
  }: {
    questions: string[];
  }) => {
    return questions;
    // return questions.join(", ");
  }),
  CREATE_PLAN: span({ kind: 'TOOL', toolName: 'CREATE_PLAN' }, async ({
    summary,
    plan,
  }: {
    summary: string;
    plan: string[];
  }) => {
    return { plan, summary }
    // return plan.join(", ");
  }),
  SAVE_MEMORY: span({ kind: 'TOOL', toolName: 'SAVE_MEMORY' }, async ({ fact }: { fact: string[] }) => {
    memoryManager.saveMemory(projectRoot, { fact });
    return "saved"
  })
};
