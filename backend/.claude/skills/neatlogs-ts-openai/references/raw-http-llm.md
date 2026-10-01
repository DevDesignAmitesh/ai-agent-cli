# Raw HTTP LLM Calls — TypeScript Manual-Span Reference

When a Node app calls a model API over **raw HTTP** (`fetch` / `undici` / `axios` / `node:https`) instead of a vendor SDK, NeatLogs auto-instrumentation and the provider wrappers (`wrapOpenAI`, `wrapAnthropic`, …) are **blind** — there is no SDK method to patch. You must add a **manual span** and set input / output / token attributes **by hand**, reading them from the raw request/response.

## The two-source rule

1. **Read the app's existing parse code FIRST.** A working raw-HTTP call already pulls text/tokens out of the response JSON. Tap the SAME values into span attributes — that's the ground truth, no external knowledge needed.
2. **Use the wire-format field paths as a fallback** when the code parses loosely. **The HTTP request/response JSON shapes are identical to the Python reference** — see `neatlogs-py-setup/references/raw-http-llm-formats.md` for the per-provider paths (OpenAI Chat + Responses, Anthropic, Gemini Vertex + AI Studio; streaming + non-streaming; the token-location gotchas). The wire is language-agnostic; only the SDK API below differs.

**Sync/async is irrelevant** — it's just HTTP. Same JSON, same field paths.

## Detect the provider from the request URL

| URL contains | Provider | Wire format |
|---|---|---|
| `api.openai.com/v1/chat/completions`, `*.openai.azure.com/...`, Groq/Together | OpenAI Chat (-compatible) | §A in the Python ref |
| `api.openai.com/v1/responses` | OpenAI Responses | §B |
| `api.anthropic.com/v1/messages` | Anthropic | §C |
| `generativelanguage.googleapis.com/...:generateContent`, `*-aiplatform.googleapis.com/...:generateContent`, `:streamGenerateContent` | Gemini (AI Studio / Vertex) | §D |

## Canonical attribute names

Set the canonical `neatlogs.*` names exactly — the backend only renders keys it recognizes. Unlike the Python SDK (which ships `config/attribute-mapping.json` as a readable file), the **TypeScript SDK inlines the mapping into its bundled JS**, so there is no file to open at runtime. The authoritative names are listed here:

| Purpose | Attribute |
|---|---|
| span kind | `neatlogs.span.kind` (the `trace({ kind: 'LLM' })` call sets it) |
| dashboard visibility | `neatlogs.internal` → **`false`** on a manual LLM span with no auto-instrumented sibling (else the backend drops it) |
| model | `neatlogs.llm.model_name` |
| provider | `neatlogs.llm.provider` |
| input (whole) | `neatlogs.llm.input` — JSON `{"messages":[...]}` |
| input (indexed) | `neatlogs.llm.input_messages.{i}.role` / `.content` |
| output (whole) | `neatlogs.llm.output` — JSON `{"role":"assistant","content":...}` |
| output (indexed) | `neatlogs.llm.output_messages.{i}.role` / `.content` |
| tokens | `neatlogs.llm.token_count.{prompt,completion,total,cache_read,cache_write,reasoning}` |
| finish/stop | `neatlogs.llm.finish_reason` / `neatlogs.llm.stop_reason` |
| tool span | `neatlogs.tool.{name,description,id,parameters}` |

(These match the Python SDK's `config/attribute-mapping.json` one-for-one. If you need a key not listed, check `neatlogs-py-setup/references/llm-call-patterns.md` "Authoritative attribute names" — the canonical set is shared across both SDKs.)

The runtime accepts the extended `LLM` kind on `trace()`, but the current TypeScript declaration limits `TraceOptions.kind` to decorator-safe kinds. Use `kind: 'LLM' as any` only at this unsupported/raw boundary; do not switch to `span()`, which rejects `LLM` at runtime.

---

## Non-streaming → use the `trace()` callback

`trace(opts, async (span) => {...})` opens the span, runs the callback, and closes it when the callback returns. Perfect for a single awaited request:

```typescript
import { trace } from 'neatlogs';

async function rawGeminiCall(model: string, inputMessages: any[], payload: object, url: string, headers: Record<string,string>) {
  return await trace({ name: 'raw_gemini_request', kind: 'WORKFLOW' }, async () =>
    trace({ name: 'Gemini generate', kind: 'LLM' as any }, async (span) => {
    span.setAttribute('neatlogs.internal', false);
    span.setAttribute('neatlogs.llm.provider', 'google');
    span.setAttribute('neatlogs.llm.model_name', model);
    span.setAttribute('neatlogs.llm.input', JSON.stringify({ messages: inputMessages }));

    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (!resp.ok) throw new Error('LLM request failed: ' + resp.status);
    const data = await resp.json();

    // Field paths per provider — see the Python wire-format ref (§A–§D).
    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') ?? '';
    span.setAttribute('neatlogs.llm.output', JSON.stringify({ role: 'assistant', content: text }));

    const u = data.usageMetadata ?? {};
    span.setAttribute('neatlogs.llm.token_count.prompt', u.promptTokenCount ?? 0);
    span.setAttribute('neatlogs.llm.token_count.completion', u.candidatesTokenCount ?? 0);
    span.setAttribute('neatlogs.llm.token_count.total', u.totalTokenCount ?? 0);
    return data;
    }),
  );
}
```

The manual `LLM` can finalize as a parentless root. Keep the explicit
`WORKFLOW` only when this call belongs to a larger app-owned run. Supported
wrappers already own their LLM span and must not be placed inside this manual
LLM pattern.

---

## Streaming raw HTTP

A `trace()` callback closes when its callback settles, so returning a stream or
async iterator from that callback closes the LLM span before the stream is
consumed. Do not work around this with
`@opentelemetry/api.trace.getTracer(...).startSpan()`: Neatlogs uses a private
tracer provider, and a span from the global provider is not a Neatlogs span and
will not be exported by Neatlogs.

Prefer a supported provider SDK and its Neatlogs wrapper for streaming. If raw
HTTP is unavoidable, consume and accumulate the complete bounded response
inside the manual `LLM` callback, set final output, usage, finish reason, and
errors before it settles, and only then return buffered data. If the application
must expose chunks incrementally and no supported capture owner exists, report
streaming capture as unsupported instead of claiming a partial or globally
exported span.
