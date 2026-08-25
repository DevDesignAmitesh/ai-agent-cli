# ai-agent-cli

A CLI-based AI coding agent that plans tasks, asks clarifying questions, runs bash commands, and edits code inside a sandboxed project workspace — with pluggable OpenAI/Gemini providers and persistent project memory.

## Features

- **Agent loop** — takes a natural language request and works through it step by step until done
- **Multi-provider support** — works with OpenAI and Gemini, switchable per session
- **Tool calling**
  - `BASH` — runs shell commands inside the project workspace (with user approval)
  - `ASK_QUESTION` — asks the user for clarification when something is unclear
  - `CREATE_PLAN` — proposes a plan and waits for approval before executing
  - `SAVE_MEMORY` — stores useful facts about the project/user preferences for future sessions
- **Session management** — conversation history persists across runs, with automatic summarization once a session grows too large
- **Sandboxed workspace** — the agent is restricted to a single project directory and cannot touch anything outside it
- **Bundled template** — a Bun + React starter project (`template/`) the agent can scaffold into

## Project structure

```
ai-agent-cli/
├── backend/     # the CLI agent itself
│   └── src/
│       ├── agent-loop.ts        # core loop: call model → run tool → repeat
│       ├── ai-providers/        # OpenAI + Gemini integrations
│       ├── manager/             # session + memory managers
│       ├── prompts/             # system prompts
│       └── tools.ts             # tool implementations
└── template/    # Bun + React scaffold used as a starting project
```

## Setup

**Requirements:** [Bun](https://bun.sh)

```bash
cd backend
bun install
```

Set the required environment variables:

```bash
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
NEATLOGS_API_KEY=your_neatlogs_key   # optional, used for logging/tracing
```

## Usage

```bash
cd backend
bun src/index.ts
```

You'll be prompted with `How can i help you?` — describe what you want done in the current project, and the agent will plan, ask questions if needed, and execute using its available tools.

## Status

Early-stage / work in progress. Expect rough edges.

## License

Not yet specified.
