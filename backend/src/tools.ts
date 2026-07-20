import { memoryManager } from "./manager/memory.manager";
import { bash, projectRoot } from "./utils/tool.utils";

export const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "ASK_QUESTION",
        description: `
          Ask the user clarifying questions before implementing anything.

          Use this tool when you have doubts or need more information about:
          - The user's prompt or requirements
          - Ambiguities in the codebase
          - Multiple valid approaches and you need the user to decide
          - Missing context that would affect how the task is implemented

          IMPORTANT: Always use this tool BEFORE starting any implementation if there
          are unresolved questions. Never assume — ask first.

          Input:
          - questions: An array of specific questions to present to the user.

          Returns: void (the user's response will come in the next message)
        `,        
        parameters: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: ["questions"],
        },
      },
      {
        name: 'BASH',
        description: `
          Execute a bash command in the project's WSL environment.

          Use this tool when you need to:
          - Inspect the project structure (ls, find, tree)
          - Read files (cat, head, tail)
          - Search code (grep, rg)
          - Check the current directory (pwd)

          Input:
          - command: The bash command to execute.

          Returns:
          {
            stdout: "Command standard output",
            stderr: "Command error output"
          }

          If the command fails unexpectedly, the tool may return null.
        `,        
        parameters: {
          type: "object",
          properties: {
            command: { type: "string", },
          },
          required: ["command"],
        },
      },
      {
        name: 'CREATE_PLAN',
        description: `
          Share the implementation plan with the user before making any changes.

          Use this tool BEFORE implementing any changes or creating any files to
          let the user know exactly what steps you are going to take. This gives
          the user a chance to review and correct the approach before execution.

          Input:
          - plan: A structured list of steps describing what you intend to do.
          - summary: A brief one-line description of the overall goal.

          Returns: void
        `,     
        parameters: {
          type: "object",
          properties: {
            summary: {
              type: "string",
            },
            plan: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: ["summary", "plan"],
        },
      },
      {
        name: "SAVE_MEMORY",
        description: `
          Save a durable fact about this project or the user's preferences so it
          persists across conversations, even after older messages get summarized
          or dropped.

          Use this tool when you learn something worth remembering long-term:
          - A project convention (e.g. "use pnpm, not npm")
          - A decision the user made that should stick
          - A correction the user gave you that you shouldn't repeat

          Do NOT use this for task-specific details that only matter for the
          current step — only for facts that should apply going forward.

          Input:
          - fact: One or more short, standalone facts to remember.
          - projectPath: The project this memory belongs to.

          Returns: void
        `,
        parameters: {
          type: "object",
          properties: {
            fact: {
              type: "array",
              items: { type: "string" },
              description: "One or more standalone facts worth remembering long-term.",
            },
            projectPath: {
              type: "string",
              description: "The project directory this memory applies to.",
            },
          },
          required: ["fact", "projectPath"],
        },
      },
    ],
  },
];


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