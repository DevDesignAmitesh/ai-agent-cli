# Step 5: Lifecycle (flush / shutdown)

All lifecycle calls are async — `await` them.

## Script / one-shot run (CLI, `tsx src/index.ts`)

Flush + shutdown after the work completes so buffered spans are exported before the process exits.

```typescript
async function main() {
  await runSingleQuery();
  await runWorkflow();
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(async () => {
    await flush();
    await shutdown();
  });
```

If the entry already has a `main().catch(...)`, add a `.finally()` with `await flush(); await shutdown();` (or put them at the end of `main`'s try/finally). Do NOT leave them out — a script that exits without flushing loses the last batch of spans.

## Long-running server (Express/Fastify/etc.)

Call `init()` ONCE at startup. Do NOT flush/shutdown per request. Flush on graceful shutdown:

```typescript
process.on("SIGTERM", async () => {
  await flush();
  await shutdown();
  process.exit(0);
});
```

## Verify
- [ ] Script: `await flush()` then `await shutdown()` run after the work (e.g. in `main().finally(...)`).
- [ ] Server: init once at startup; flush/shutdown only on SIGTERM/SIGINT, never per-request.
