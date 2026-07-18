import { bash } from "./project-files";
import { type FunctionTool } from "./types";

export const TOOLS: FunctionTool[] = [
  {
    name: "BASH",
    description: `
      Execute a bash command in the project's WSL environment.

      Execute all this command inside this workspace: E:\\S-30-3.0\\lovable-v1\\template
      
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
        command: {
          type: "string",
          description:
            "A bash command strictly limited to file/folder CRUD operations (cat, ls, touch, mkdir, cp, mv, rm, sed, find, tree, etc.). No install, build, test, or server commands.",
        },
      },
      required: ["command"],
      additionalProperties: false,
    },
    type: "function",
  },
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
          description:
            "A list of specific questions to ask the user before proceeding with implementation.",
        },
      },
      required: ["questions"],
      additionalProperties: false,
    },
    type: "function",
  },
  {
    name: "CREAT_PLAN",
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
          description:
            "A brief one-line description of the overall goal or task.",
        },
        plan: {
          type: "array",
          items: {
            type: "string",
          },
          description:
            "An ordered list of steps describing what actions will be taken to complete the task.",
        },
      },
      required: ["summary", "plan"],
      additionalProperties: false,
    },
    type: "function",
  },
];

export const TOOL_IMPLEMENTATIONS = {
  BASH: bash,
  ASK_QUESTION: async ({
    questions,
  }: {
    questions: string[];
  }) => {
    // return questions;
    return questions.join(", ");
  },
  CREAT_PLAN: async ({
    summary,
    plan,
  }: {
    summary: string;
    plan: string[];
  }) => {
    // return { plan, summary }
    return plan.join(", ");
  },
};