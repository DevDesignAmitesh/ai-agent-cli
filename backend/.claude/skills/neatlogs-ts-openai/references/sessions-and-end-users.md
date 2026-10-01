# Sessions & End-Users Reference — NeatLogs TypeScript SDK

Lineage uses `parentSessionId`. Application-specific session data belongs in the
arbitrary `sessionCustomFields` object and is stored as
`neatlogs.session.custom_fields`; never add a fixed SDK option for an individual
custom key:

```typescript
await identify({
  sessionId: 'child_123',
  parentSessionId: 'parent_456',
  sessionCustomFields: { feature_name: 'chat', entry_point: 'slack', tenant: 'acme' },
  endUserId: 'u_456',
}, runTurn);
```


Attach **your application's end-user identity** and a **conversation/session id** to traces so the NeatLogs dashboard can roll them up.

## Why

Without this, traces are anonymous. With it you get customer-level analytics:
- Usage, cost, and error rates per end-user and per segment (e.g. `plan: 'pro'`).
- Multi-turn conversation timelines grouped by session.
- Per-customer replay — pull up every trace a given user produced.

## The model

- **One turn = one trace.** Each user message → one root trace (the parentless wrapped LLM span, or a manual `trace()` / `span()`).
- **A session groups turns.** Reuse the **same `sessionId`** across every turn of a conversation and the backend stitches them into one session timeline.
- **End-user is per session.** Set `endUserId` (+ optional `endUserMetadata`) on each turn's root; it identifies *your app's* customer, not the SDK operator.
- **Identity is root-only.** Set it once on the trace root — the backend rolls it up across all child spans. Do not set it on nested spans.

> `init()` does NOT take `sessionId`, `autoSession`, or an end-user param. Its `userId` is the **operator** running the SDK, not your application's user. Session and end-user identity are strictly **per-request**.

## Wrapper-only: `identify()` per turn

When the project only uses a provider wrapper (`wrapOpenAI`, `wrapAnthropic`, …) with no manual root, wrap each turn in `identify()`. The parentless LLM root inherits the session + end-user:

```typescript
import { init, identify, wrapOpenAI } from 'neatlogs';
import { OpenAI } from 'openai';

await init({ apiKey: '...', workflowName: 'support-bot' });
const client = wrapOpenAI(new OpenAI());

// A multi-turn chat: same sessionId + endUserId on every turn groups them.
async function chatTurn(conversationId: string, userId: string, message: string) {
  return await identify(
    { sessionId: conversationId, endUserId: userId, endUserMetadata: { plan: 'pro' } },
    async () => {
      const res = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: message }],
      });
      return res.choices[0].message.content;
    },
  );
}

// Two turns of ONE conversation → one session, one end-user:
await chatTurn('conv_123', 'u_456', 'What is your refund policy?');
await chatTurn('conv_123', 'u_456', 'And how long does it take?');
```

## If the app opens its own root

When you already wrap the turn in `trace()` or `span()`, set the same fields there instead of `identify()`:

```typescript
await trace(
  { name: 'turn', sessionId: 'conv_123', endUserId: 'u_456', endUserMetadata: { plan: 'pro' } },
  async () => { /* this turn's LLM calls */ },
);

// or on a root span:
await span({ kind: 'WORKFLOW', sessionId: 'conv_123', endUserId: 'u_456' }, fn)();
```

## Browser SDK

The `neatlogs/browser` SDK uses the **same field names** — `sessionId`, `endUserId`, `endUserMetadata` — on `identify()` / `trace()` / `span()`. Nothing to relearn client-side.

## Dashboard

Filter and segment traces by `endUserId`, `sessionId`, or any `endUserMetadata` key (e.g. `plan`) in the NeatLogs dashboard.
