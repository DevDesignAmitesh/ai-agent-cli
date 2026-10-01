# Step 4: Group Orchestration Without Double-Instrumenting LLM Calls

## One capture owner per operation

The provider wrapper owns the LLM span. Call the wrapped client normally; do not put `trace({ kind: "LLM" })`, `span()`, or another instrumentor around that call.

```typescript
const client = wrapOpenAI(new OpenAI());

// Correct: wrapOpenAI emits the canonical LLM span.
const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages,
});
```

```typescript
// WRONG: this creates a redundant manual LLM layer around the wrapper-owned span.
await trace({ name: "llm_call", kind: "LLM" }, async () =>
  client.chat.completions.create({ model: "gpt-4o", messages }),
);
```

This rule applies to every supported helper: `wrapOpenAI`, `wrapAzureOpenAI`, `wrapAnthropic`, `wrapGoogleGenAI`, `wrapVertexAI`, and `wrapBedrock`.

## Custom orchestration

Use `span()` only when the user's code performs meaningful orchestration beyond a single wrapped call. A `WORKFLOW` represents the user-facing request/job, a `CHAIN` represents a multi-step pipeline stage, and an `AGENT` represents a decision loop; their wrapped provider calls remain canonical LLM children.

```typescript
const answer = span({ kind: "WORKFLOW", name: "answer" }, async (query: string) => {
  const context = await retrieve(query);
  return client.chat.completions.create({
    model: "gpt-4o",
    messages: buildMessages(query, context),
  });
});
```

Do not create an orchestration span merely to make one wrapped call render; wrappers auto-open a WORKFLOW root when necessary.

## Unsupported or raw LLM calls

Use manual `trace({ kind: "LLM" })` only when no wrapper, handler, hook, processor, or instrumentor captures the call—for example a raw `fetch` to a model endpoint or a provider with no helper. In that manual span, record the canonical LLM input, output, model, token usage, status, and errors yourself. See `raw-http-llm.md`.

## Verify

- [ ] Every supported provider client is wrapped exactly once and the wrapped reference is used.
- [ ] No `trace({ kind:"LLM" })` or `span()` surrounds an individual wrapped call.
- [ ] Manual LLM spans exist only for unsupported/raw calls with no automatic capture owner.
- [ ] WORKFLOW/CHAIN/AGENT spans represent genuine multi-step orchestration.
- [ ] A runtime trace contains one canonical LLM span per real model call.
