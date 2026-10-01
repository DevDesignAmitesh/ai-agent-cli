# Troubleshooting — NeatLogs TypeScript SDK Reference

Common mistakes, anti-patterns, and diagnostic steps for the NeatLogs TypeScript SDK.

---

## 1. `instrumentations: [...]` Was Removed (Most Common Mistake)

| Wrong | Right |
|-------|-------|
| `await init({ instrumentations: ['openai'] })` | `await init({ ... })` then `wrapOpenAI(new OpenAI())` |

The public option and runtime registry are removed because OpenInference/OTel-contrib instrumentors drive process-global OTel context, which Neatlogs' private provider cannot isolate. TypeScript rejects the property; the JavaScript compatibility guard throws a typed configuration error naming the replacement approach.

```typescript
// ❌ WRONG — the option no longer exists; the runtime compatibility guard throws
await init({ instrumentations: ['openai'] });

// ✅ RIGHT — per-instance wrapper; import order is irrelevant
import { OpenAI } from 'openai';
import { init, wrapOpenAI } from 'neatlogs';
await init({ apiKey: process.env.NEATLOGS_API_KEY });
const client = wrapOpenAI(new OpenAI());
```

Because the helpers patch the **instance** you pass (not the module), there is **no import-order rule** in the TypeScript SDK and no need for dynamic `import()`. See the [Provider → helper table](../SKILL.md#provider--helper) for the helper for each library.

---

## 2. Forgetting to Await Lifecycle Functions

`init()`, `flush()`, and `shutdown()` are all async and MUST be awaited.

```typescript
// ❌ WRONG — not awaiting
init({ apiKey: '...' });  // Returns a Promise that's never awaited

// ✅ RIGHT
await init({ apiKey: '...' });
```

```typescript
// ❌ WRONG — not awaiting shutdown
flush();
shutdown();

// ✅ RIGHT
await flush();
await shutdown();
```

---

## 3. Missing Traces Diagnostic Flowchart

If traces are not appearing in the NeatLogs dashboard, check these in order:

1. **Is `await init()` called?** → No → Add `await init(...)` at the top of your entry file.
2. **Did `init()` throw a configuration error?** → Remove any obsolete `instrumentations: [...]` property and use the explicit helper (see §1).
3. **Is the client actually wrapped?** → No → Apply the matching helper from the [Provider → helper table](../SKILL.md#provider--helper), e.g. `const client = wrapOpenAI(new OpenAI())`. Wrapping the *return value* and then calling the **original** variable is the usual slip.
4. **Is `NEATLOGS_API_KEY` set?** → No → Set it via env var or `apiKey` param. Without it, export is **silently disabled**.
5. **Does a helper exist for this library?** → Check the [Provider → helper table](../SKILL.md#provider--helper). If not, the calls are raw HTTP as far as Neatlogs is concerned → add manual spans (see [`raw-http-llm.md`](raw-http-llm.md)).
6. **Still missing?** → Enable `debug: true` in `init()` and check console output for clues.

---

## 4. HTTP Auto-Instrumentation (Always On)

`init()` **always** instruments Node.js `fetch`/`undici` for trace context propagation. There is nothing to configure.

---

## 5. Flush/Shutdown Gotcha

Scripts (not long-running servers) **MUST** call `await flush()` then `await shutdown()` before exit. Without them, the last batch of spans may not be exported.

```typescript
// At the end of your script
await flush();
await shutdown();
```

### Long-Running Servers

For servers, call `init()` **once at startup** and `flush()` / `shutdown()` **once at shutdown** — NOT on every request:

```typescript
// ❌ WRONG — flush on every request
app.get('/ask', async (req, res) => {
  const response = await client.chat.completions.create({ /* ... */ });
  await flush();    // ← Don't do this per request
  res.json({ answer: response.choices[0].message.content });
});

// ✅ RIGHT — flush only on shutdown
process.on('SIGTERM', async () => {
  await flush();
  await shutdown();
  process.exit(0);
});
```

**Why?** `flush()` on every request sends one HTTP batch per request instead of one every `flushInterval` seconds (default 5s) — this risks API throttling and adds latency.

---

## 6. Removed Instrumentation Keys

No provider/framework key is accepted. The old no-op keys and their registry entries were removed too, so they cannot silently imply coverage.

Use the [Provider → helper table](../SKILL.md#provider--helper) as the source of truth. For a library with no helper, instrument the call sites manually — see [`raw-http-llm.md`](raw-http-llm.md).

---

## 7. Debug Mode

```typescript
await init({ debug: true });
```

- Enables verbose logging to console (instrumentation status, span creation, export status)
- Enables `log()` echo to console
- Shows endpoint configuration, provider/exporter setup, etc.

---

## 8. Common Anti-Patterns Table

| Anti-Pattern | Why It's Wrong | Fix |
|-------------|----------------|-----|
| Wrapping `span({ kind: 'WORKFLOW' })` in `trace()` | Redundant — `span()` already creates a span | Just call the wrapped function directly |
| Using `trace()` for custom functions where `span()` would work | That's what `span()` is for | Use `span({ kind: 'CHAIN' })` or the appropriate kind |
| Passing `instrumentations: ['openai']` (or any provider/framework key) | `init()` **throws** | Remove the key; use `wrapOpenAI(client)` etc. |
| Leaving a client unwrapped | Its LLM calls won't be traced | Apply the helper to every provider client your code constructs |
| Using `span({ kind: 'RERANKER' })` or `span({ kind: 'VECTOR_STORE' })` | `span()` throws Error for invalid kinds | Use `trace({ name: '...', kind: 'RERANKER' as any })`; the cast is required by the current narrow type declaration and a standalone call is auto-rooted |
| Using dynamic `import()` "so instrumentation applies" | Pointless — helpers patch instances, not modules | Use a plain static `import` |
| Using `span({ kind: 'LLM' })` | `LLM` is not a valid kind for `span()` | For an unsupported/raw call, use `trace({ name: '...', kind: 'LLM' as any })`; a parentless LLM is root-eligible |

---

## 9. Manual `trace({ kind: 'LLM' })` Span Disappears From Dashboard

**Symptom**: A chat/agent step shows its parent AGENT span with no children in the UI.

This section applies only to a raw HTTP or unsupported SDK call with no wrapper,
handler, hook, processor, or instrumentor. Automatically captured calls must
not get another manual LLM trace.

**Root cause**: `trace()` stamps `neatlogs.internal = true` by default. A parentless manual LLM is retained as the trace root, but a nested internal LLM can be deduplicated as a wrapper helper.

**Fix**: Opt out of the internal flag inside the callback:

```typescript
await trace({ name: 'raw_api_request', kind: 'WORKFLOW' }, async () =>
  trace({ name: 'raw_api_llm_call', kind: 'LLM' as any }, async (span) => {
    span.setAttribute('neatlogs.internal', false);   // required
    // ... canonical input/model, API call, output/usage/error writes ...
  }),
);
```

If a real eligible parent is already active, reuse it instead of adding another root and set `neatlogs.internal = false` only on the manually owned raw LLM child. A parentless manual LLM can finalize as its own root.

> Do NOT override `neatlogs.internal = false` on a `trace()` that wraps a call a `wrap*` helper already traces. The wrapper's own LLM span IS the canonical record — leaving the internal flag in place correctly removes the redundant outer span.

---

## 10. Data Masking

Per-span mask override:

```typescript
import { span } from 'neatlogs';
import type { MaskFunction } from 'neatlogs';

const redactPii: MaskFunction = (spanData) => {
  for (const key of Object.keys(spanData)) {
    if (key.includes('email') || key.includes('password')) {
      spanData[key] = '[REDACTED]';
    }
  }
  return spanData;
};

const lookupUser = span(
  { kind: 'TOOL', toolName: 'lookup_user', mask: redactPii },
  async (email: string) => {
    return await db.findUser(email);
  },
);
```

> **Note**: Per-span mask takes precedence — the global `init({ mask })` mask is skipped for that span.
