# Decorators and Traces Reference — NeatLogs TypeScript SDK

Complete reference for all manual instrumentation APIs in the NeatLogs TypeScript SDK.

---

## 1. `span()` Function Wrapper

The primary manual instrumentation API for custom code. Wraps a function to create an OpenTelemetry span with NeatLogs-specific attributes.

### Signature

```typescript
import { span } from 'neatlogs';
import type { SpanOptions } from 'neatlogs';

const wrapped = span(options: SpanOptions, fn: (...args) => any);
```

### SpanOptions

```typescript
interface SpanOptions {
  kind: SpanKind;           // Required: span kind
  name?: string;            // Span name (defaults to function name)
  description?: string;     // Human-readable description
  captureInput?: boolean;   // Serialize function args (default: true)
  captureOutput?: boolean;  // Serialize return value (default: true)
  mask?: MaskFunction;      // Per-span mask function
  internal?: boolean;       // Mark as internal span

  // Agent-specific
  role?: string;            // AGENT: agent role
  goal?: string;            // AGENT: agent goal

  // Tool-specific
  toolName?: string;        // TOOL/MCP_TOOL: tool name
  parameters?: Record<string, any>;  // TOOL: tool parameters
  toolJsonSchema?: Record<string, any>;  // MCP_TOOL: JSON schema

  // Embedding-specific
  model?: string;           // EMBEDDING: model name
  dimension?: number;       // EMBEDDING: embedding dimension
}
```

> **Note**: Unlike the Python SDK, the TypeScript `SpanOptions` does NOT have `captureStdout`, `tags`, or `version` fields.

### Valid Kinds

`span()` throws an `Error` for any kind not in this set:

`WORKFLOW`, `AGENT`, `CHAIN`, `TOOL`, `RETRIEVER`, `EMBEDDING`, `GUARDRAIL`, `MCP_TOOL`

### When to Use Each Kind

#### WORKFLOW

Top-level entry point that orchestrates the full pipeline.

```typescript
import { span } from 'neatlogs';

const runPipeline = span({ kind: 'WORKFLOW' }, async (topic: string) => {
  const analysis = await researcher(topic);
  const report = await writer(analysis);
  return report;
});
```

#### AGENT

Function representing an AI agent with a specific role/goal.

```typescript
import { span } from 'neatlogs';

const researcher = span(
  { kind: 'AGENT', name: 'researcher', role: 'Research Analyst', goal: 'Find relevant information' },
  async (topic: string) => {
    // ... agent logic with LLM calls ...
    return findings;
  },
);
```

#### CHAIN

Sequential processing step for intermediate processing or pipeline stages.

```typescript
import { span } from 'neatlogs';

const processDocuments = span({ kind: 'CHAIN' }, async (docs: string[]) => {
  return docs.map((d) => d.trim().toLowerCase());
});
```

#### TOOL

Tool/function call (web search, calculator, API call, etc.).

```typescript
import { span } from 'neatlogs';

const webSearch = span(
  { kind: 'TOOL', toolName: 'web_search', description: 'Search the web' },
  async (query: string) => {
    return await searchApi.search(query);
  },
);
```

#### RETRIEVER

RAG retrieval. Automatically extracts documents from the return value.

```typescript
import { span } from 'neatlogs';

const retrieveDocs = span({ kind: 'RETRIEVER' }, async (query: string) => {
  return await vectorDb.search(query, { topK: 5 });
});
```

The RETRIEVER postprocessor automatically:
- Extracts the query from function args named `query`, `question`, or `text`
- Extracts documents from array results or objects with `documents`/`docs`/`results` keys
- Sets canonical `neatlogs.retriever.documents.N.{content,id,score,metadata}` attributes for every returned document; do not truncate results client-side

#### EMBEDDING

Embedding generation.

```typescript
import { span } from 'neatlogs';

const embedTexts = span(
  { kind: 'EMBEDDING', model: 'text-embedding-3-small', dimension: 1536 },
  async (texts: string[]) => {
    return await embeddingModel.encode(texts);
  },
);
```

#### GUARDRAIL

Input/output validation and safety checks.

```typescript
import { span } from 'neatlogs';

const checkToxicity = span({ kind: 'GUARDRAIL' }, async (text: string) => {
  const result = await toxicityModel.check(text);
  return { passed: result.score < 0.5, score: result.score };
});
```

#### MCP_TOOL

MCP protocol tool handlers. Automatically wraps string results as `{ result: "..." }` and extracts input from the first argument.

```typescript
import { span } from 'neatlogs';

const getWeather = span(
  { kind: 'MCP_TOOL', toolName: 'get_weather', description: 'Get current weather' },
  async (location: string) => {
    return `Weather in ${location}: Sunny, 72°F`;
  },
);
```

### `captureInput` / `captureOutput`

Default is `true` for both. Set to `false` to suppress serialization — useful for large payloads or sensitive data.

```typescript
const processLargeFile = span(
  { kind: 'CHAIN', captureInput: false, captureOutput: false },
  async (data: Buffer) => { /* ... */ },
);
```

### Complete Multi-Agent Example

```typescript
import { init, wrapOpenAI, span, flush, shutdown } from 'neatlogs';
import { OpenAI } from 'openai';

await init({
  apiKey: '...',
  workflowName: 'research-app',
});

const client = wrapOpenAI(new OpenAI());

const webSearch = span(
  { kind: 'TOOL', toolName: 'web_search' },
  async (query: string) => {
    return `Results for: ${query}`;
  },
);

const researcher = span(
  { kind: 'AGENT', name: 'researcher', role: 'Research Analyst' },
  async (topic: string) => {
    const searchResults = await webSearch(topic);
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: `Analyze: ${searchResults}` }],
    });
    return response.choices[0].message.content;
  },
);

const runPipeline = span({ kind: 'WORKFLOW' }, async (topic: string) => {
  return await researcher(topic);
});

await runPipeline('quantum computing');
await flush();
await shutdown();
```

---

## 2. `Span()` Class Method Decorator

TC39 Stage 3 class-method decorator variant of `span()`. Uses the same `SpanOptions`.

```typescript
import { Span } from 'neatlogs';

class ResearchAgent {
  @Span({ kind: 'AGENT', role: 'researcher' })
  async run(query: string) {
    // ... agent logic ...
    return findings;
  }

  @Span({ kind: 'TOOL', toolName: 'summarize' })
  summarize(text: string) {
    return text.slice(0, 200);
  }
}
```

> **Note**: The `Span()` decorator requires TypeScript 5.0+ with `experimentalDecorators` disabled (TC39 Stage 3 decorators). It is a `ClassMethodDecoratorContext` decorator.

---

## 3. `trace()` Callback Wrapper

For unsupported/custom operations that need direct canonical span attributes.
Do not use `trace()` as a second LLM capture layer around a call
owned by a wrapper, handler, hook, processor, or instrumentor.

### Signature

```typescript
import { trace } from 'neatlogs';
import type { TraceOptions } from 'neatlogs';

const result = await trace(options: TraceOptions, async (span) => {
  // user code runs here with the span active
  return value;
});
```

### TraceOptions

```typescript
interface TraceOptions {
  name: string;                  // Required: span name
  kind?: SpanKind;               // Span kind (default: 'CHAIN')
  mask?: MaskFunction;           // Per-trace mask function
  attributes?: Record<string, any>;  // Custom span attributes
}
```

**IMPORTANT**: Unlike `span()`, `trace()` does NOT validate the kind string at runtime. It accepts extended values including `'LLM'`, `'RERANKER'`, and `'VECTOR_STORE'`, although the current `TraceOptions.kind` type is narrower; use `kind: 'LLM' as any` (or the corresponding extended kind) at that boundary. Use `'LLM'` only when this manual trace is the sole capture owner for an unsupported/raw call.

When `kind` is not provided, it defaults to `'CHAIN'`.

### Sessions & end-user

Session and end-user identity are **per-request** and set at the **trace root** — never on `init()` (`init()` does NOT take `sessionId` / `autoSession`).

Per turn, set them on the root `trace()` or `span()`:

```typescript
await trace(
  { name: 'turn', sessionId: 'conv_123', endUserId: 'u_456', endUserMetadata: { plan: 'pro' } },
  async () => { /* this turn's work */ },
);

// or on a root span:
await span({ kind: 'WORKFLOW', sessionId: 'conv_123', endUserId: 'u_456' }, fn)();
```

Wrapper-only code (only `wrap(...)` calls, no manual root) uses `identify()` — the wrapper's auto-root inherits it:

```typescript
await identify({ sessionId: 'conv_123', endUserId: 'u_456' }, async () => {
  /* wrapped LLM call */
});
```

Reuse the same `sessionId` on every turn to group them into one session; the end-user is per session. Identity is **root-only** — set it once on the root and the backend rolls it up across the trace.

### Span Object Methods

The `span` parameter in the callback is an OpenTelemetry `Span`. Available methods:

```typescript
await trace({ name: 'my_op', kind: 'CHAIN' }, async (span) => {
  span.setAttribute('key', 'value');        // Add a custom attribute
  span.recordException(error);               // Record an exception
  span.setStatus({ code: SpanStatusCode.ERROR, message: 'msg' });
  span.addEvent('event_name', { key: 'val' });
});
```

### Use Cases for `trace()`

1. **Custom attribute capture** — use `span.setAttribute()` inside the callback
2. **Unsupported/raw operations** — create a manual span only when no wrapper, callback, hook, processor, native telemetry, or provider instrumentor owns it
3. **Span kinds not available in `span()`**: `'LLM'`, `'RERANKER'`, `'VECTOR_STORE'`

### Common Anti-Pattern

Do NOT wrap a function that already uses `span({ kind: 'WORKFLOW' })` in `trace()` — it's redundant:

```typescript
// ❌ WRONG: Redundant wrapper
const myWorkflow = span({ kind: 'WORKFLOW' }, async () => { /* ... */ });
await trace({ name: 'main' }, async () => {
  await myWorkflow();  // Already traced by span()
});

// ✅ CORRECT: Just call it directly
await myWorkflow();
```

---

## 4. `log()` — Structured Logging

Capture timestamped log steps within the current trace.

### Signature

```typescript
import { log } from 'neatlogs';

log(msgTemplate: string, options?: Record<string, any>);
```

### Usage

```typescript
import { log } from 'neatlogs';

log('Processing query: {query}', { query: 'What is TypeScript?', level: 'info' });
log('Retrieved {count} documents', { count: 5 });
```

- `msgTemplate` uses `{key}` placeholders (single braces)
- `options` provides template variables and an optional `level` (default: `'info'`)
- Requires `captureLogs: true` in `init()` for OTel LogRecord emission
- In debug mode, logs are echoed to console

---

## 5. Combine orchestration with automatically captured calls

Use `span()` to represent real custom orchestration. Call wrapper-owned operations directly inside it; do not add an LLM `trace()` around them. Use a manual LLM trace only for an unsupported/raw call with no capture owner.

## 6. Custom Span Attributes via `trace()`

`LLM` is root-eligible. Current manual APIs add one `WORKFLOW` parent when another semantic kind would otherwise be parentless; nested calls keep their real parent. Add an explicit root when several operations belong to one run, not merely to make one operation render.

Manual spans must use these exact canonical keys:

| Kind | Exact canonical attributes |
|---|---|
| `LLM` | Required when available: `neatlogs.llm.provider`, `neatlogs.llm.model_name`, `neatlogs.llm.input_messages.{i}.role`, `neatlogs.llm.input_messages.{i}.content`, `neatlogs.llm.output_messages.{i}.role`, `neatlogs.llm.output_messages.{i}.content`, `neatlogs.llm.token_count.prompt`, `neatlogs.llm.token_count.completion`, `neatlogs.llm.token_count.total`. Also report `neatlogs.llm.system`, `neatlogs.llm.finish_reason` or `neatlogs.llm.stop_reason`, `neatlogs.llm.is_streaming`, `neatlogs.llm.temperature`, `neatlogs.llm.top_p`, `neatlogs.llm.top_k`, `neatlogs.llm.max_tokens`, and `neatlogs.llm.invocation_parameters` when known. |
| `RETRIEVER` | `neatlogs.retriever.query`, `neatlogs.retriever.top_k`, `neatlogs.retriever.documents.{i}`, `neatlogs.retriever.input`, `neatlogs.retriever.output` |
| `RERANKER` | `neatlogs.reranker.model_name`, `neatlogs.reranker.query`, `neatlogs.reranker.top_k`, `neatlogs.reranker.input_documents.{i}`, `neatlogs.reranker.output_documents.{i}`, `neatlogs.reranker.input`, `neatlogs.reranker.output` |
| `VECTOR_STORE` | `neatlogs.db.system`, `neatlogs.db.operation`, `neatlogs.db.collection_name`, `neatlogs.vectordb.index_name`, `neatlogs.vectordb.embedding_model`, `neatlogs.vectordb.vector_dimension`, `neatlogs.vectordb.similarity_algorithm`, `neatlogs.vector_store.input`, `neatlogs.vector_store.output` |
| `EMBEDDING` | `neatlogs.embedding.model_name`, `neatlogs.embedding.text`, `neatlogs.embedding.token_count`, `neatlogs.embedding.vector`, `neatlogs.embedding.invocation_parameters`, `neatlogs.embedding.input`, `neatlogs.embedding.output` |
| `GUARDRAIL` | `neatlogs.guardrail.input`, `neatlogs.guardrail.output`, `neatlogs.guardrail.passed`, `neatlogs.guardrail.score` |
| `EVALUATOR` | `neatlogs.evaluator.input`, `neatlogs.evaluator.output`; encode evaluator name, criteria, and score in JSON `neatlogs.metadata` until dedicated evaluator fields exist |

Use indexed document keys. Do not emit the legacy `neatlogs.retrieval.*` namespace or invented keys such as `neatlogs.vector_store.query`.

### RERANKER

```typescript
import { trace } from 'neatlogs';

async function rerank(query: string, docs: string[], topN = 3) {
  return await trace({ name: 'rerank', kind: 'RERANKER' as any }, async (span) => {
    span.setAttribute('neatlogs.reranker.query', query);
    span.setAttribute('neatlogs.reranker.top_k', topN);
    span.setAttribute('neatlogs.reranker.model_name', 'cohere-rerank-v3');
    docs.forEach((doc, i) =>
      span.setAttribute(`neatlogs.reranker.input_documents.${i}`, JSON.stringify(doc)),
    );
    const reranked = await rerankerModel.rerank(query, docs, topN);
    reranked.forEach((doc, i) =>
      span.setAttribute(`neatlogs.reranker.output_documents.${i}`, JSON.stringify(doc)),
    );
    return reranked;
  });
}
```

### VECTOR_STORE

```typescript
import { trace } from 'neatlogs';

async function upsertDocuments(indexName: string, docs: Document[]) {
  return await trace({ name: 'upsert_documents', kind: 'VECTOR_STORE' as any }, async (span) => {
    span.setAttribute('neatlogs.db.system', 'custom_vector_db');
    span.setAttribute('neatlogs.db.operation', 'upsert');
    span.setAttribute('neatlogs.vectordb.index_name', indexName);
    span.setAttribute('neatlogs.vector_store.input', JSON.stringify(docs));
    const result = await vectorDb.upsert(indexName, docs);
    span.setAttribute('neatlogs.vector_store.output', JSON.stringify(result));
    return result;
  });
}
```

Use `RETRIEVER` for vector search/query. `VECTOR_STORE` is for writes and index-management operations; do not invent `neatlogs.vector_store.query` or `.top_k`.

### Manual LLM Span (No SDK to Patch)

When calling an LLM API directly over raw HTTP (`fetch`/`undici`/`axios`) without an instrumented SDK — the wrappers (`wrapOpenAI`, …) are BLIND to these. **Non-streaming** uses the `trace()` callback:

```typescript
import { trace } from 'neatlogs';

async function rawLlmCall(prompt: string) {
  return await trace({ name: 'raw_api_request', kind: 'WORKFLOW' }, async () =>
    trace({ name: 'raw_api_llm_call', kind: 'LLM' as any }, async (span) => {
    span.setAttribute('neatlogs.internal', false);
    span.setAttribute('neatlogs.llm.provider', 'openai');
    span.setAttribute('neatlogs.llm.model_name', 'gpt-4o');
    span.setAttribute('neatlogs.llm.input_messages.0.role', 'user');
    span.setAttribute('neatlogs.llm.input_messages.0.content', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }] }),
    });
    if (!response.ok) throw new Error('LLM request failed: ' + response.status);
    const data = await response.json();

    span.setAttribute('neatlogs.llm.output_messages.0.role', 'assistant');
    span.setAttribute('neatlogs.llm.output_messages.0.content', data.choices?.[0]?.message?.content ?? '');
    span.setAttribute('neatlogs.llm.token_count.prompt', data.usage.prompt_tokens);
    span.setAttribute('neatlogs.llm.token_count.completion', data.usage.completion_tokens);
    span.setAttribute('neatlogs.llm.token_count.total', data.usage.total_tokens);
    span.setAttribute('neatlogs.llm.finish_reason', data.choices?.[0]?.finish_reason ?? '');
    return data;
    }),
  );
}
```

> **Important**: a parentless LLM is already root-eligible. Set `neatlogs.internal = false` when this manually owned LLM is nested under an explicit root so legacy wrapper deduplication does not treat it as a redundant helper span. Never add this manual span around a call already owned by a supported wrapper.

> **Streaming raw HTTP** can't use the `trace()` callback (it closes the span when the callback returns, but a stream yields over time). Use the manual `startSpan()`/`end()` lifecycle and the per-provider field paths — see **`references/raw-http-llm.md`**.
