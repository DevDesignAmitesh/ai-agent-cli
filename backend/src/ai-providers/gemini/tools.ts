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
            description: "The bash command to execute",
          },
          purpose: {
            type: "string",
            description: "Explanation of what's the purpose of the command",
          },
        },
        required: ["command", "purpose"],
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
      {
        name: "GET_MEMORY",
        description: `
          Retrieve all previously saved durable facts for this project.
    
          Use this tool at the start of a task, or whenever you need to recall
          project conventions, prior decisions, or user corrections that were
          saved earlier with SAVE_MEMORY.
    
          Input:
          - projectPath: The project directory to fetch memories for.
    
          Returns:
          An array of saved memory entries (each with an id and a fact) for the
          given projectPath.        `,
        parameters: {
          type: "object",
          properties: {
            projectPath: {
              type: "string",
              description: "The project directory to fetch memories for.",
            },
          },
          required: ["projectPath"],
        },
      },
      {
        name: "DELETE_MEMORY",
        description: `
          Delete a previously saved memory that is outdated, incorrect, or no
          longer applicable.
    
          Use this tool when the user corrects or contradicts a fact that was
          saved earlier, or when a saved convention/decision has changed.
    
          Input:
          - projectPath: The project directory the memory belongs to.
          - memoryIdToDelete: The id of the memory entry to delete (obtained via
            GET_MEMORY or the confirmation returned by SAVE_MEMORY).
    
          Returns: void
        `,
        parameters: {
          type: "object",
          properties: {
            projectPath: {
              type: "string",
              description: "The project directory the memory belongs to.",
            },
            memoryIdToDelete: {
              type: "string",
              description: "The id of the memory entry to delete.",
            },
          },
          required: ["projectPath", "memoryIdToDelete"],
        },
      },
    ],
  },
];