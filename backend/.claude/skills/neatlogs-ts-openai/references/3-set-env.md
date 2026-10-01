# Step 3: Set Environment Variables

## Action

1. Use the `set_env_values` tool to write to `.env`:
   - `NEATLOGS_API_KEY` — from the wizard session context
2. **Preserve EVERY key the project already declares.** Read `.env.example` (and `.env.sample`/`.env.template`) and copy ALL of its keys into `.env` with their placeholder values — provider keys (`OPENAI_API_KEY`, `GOOGLE_API_KEY`, `ANTHROPIC_API_KEY`), config, service URLs, everything. Dropping any can break the app. The resulting `.env` must be a SUPERSET of `.env.example` plus the `NEATLOGS_*` keys.
3. For each detected LLM provider, ensure its standard key exists as a placeholder if missing:
   | Provider | Env var |
   |---|---|
   | openai | `OPENAI_API_KEY` |
   | google_genai | `GOOGLE_API_KEY` (or `GEMINI_API_KEY`) |
   | anthropic | `ANTHROPIC_API_KEY` |
4. NEVER overwrite a key that already has a real value. Only ADD missing keys.
5. Ensure `.env` is in `.gitignore`.


## Verify BEFORE moving on
1. `NEATLOGS_API_KEY` is in `.env`.
2. Every `.env.example` key is present in `.env` (superset). Count them.
3. `.gitignore` contains `.env`.
