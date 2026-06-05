Day 14 | 2026-06-05
Done: proxyHandler, streamHandler, buildIngestionJob, queue definitions, index.ts wired
Tests: 47 gateway / 12 shared — all passing
Next: budgetEnforcer (Day 23 per CLAUDE.md) or providerProxy smoke test

---

## Completed days

### Day 1 — 2026-06-02
Monorepo scaffold (Bun + Turborepo), docker-compose (Postgres, ClickHouse, DragonflyDB), CLAUDE.md.

### Day 2
Drizzle + ClickHouse schema. Tables: workspaces, users, workspace_members, virtual_keys, model_pricing, alert_configs. ClickHouse: request_logs.

### Days 3–6
Zod env validation for all services (sharedEnv, gatewayEnv). GitHub Actions CI (typecheck, test, deploy pipeline).

### Day 7
Hono gateway bootstrap. Full middleware chain wired in index.ts. requestIdMiddleware (nanoid 21), rateLimiter (DragonflyDB sliding window, 60 req/min). Test suite with DragonflyDB mock.

### Days 8–11
All 3 providers implemented:
- `gateway/src/providers/openai/` — passthrough (headers + endpoint)
- `gateway/src/providers/anthropic/` — system message extraction, max_tokens injection
- `gateway/src/providers/gemini/` — role mapping, systemInstruction extraction, URL-based auth

requestValidator middleware: Zod body shape validation, SSRF guard (blocks 169.254.x, 10.x, 192.168.x, localhost, 127.0.0.1, base_url field).
Provider registry (providerRegistry map). Provider interface with optional buildUrl().
Test infrastructure: bunfig.toml preload pattern, test-setup.ts for env vars, 33 gateway tests.

### Day 12 — 2026-06-05
KeyVault service (`packages/shared/src/services/keyVault.ts`):
- encrypt/decrypt: AES-256-GCM, random IV per call, format [iv(12)][authTag(16)][ciphertext]
- decrypt throws AuthError on any tamper/failure — never exposes raw crypto errors
- generateVirtualKeyId: 'tl-vk-' + randomBytes(18).hex = 42 chars total

virtualKeyRepo (`packages/shared/src/db/repositories/virtualKeyRepo.ts`):
- findById: WHERE id AND is_active=true, returns VirtualKey | null
- findByWorkspace: strips encrypted_key, orders by created_at DESC
- create: insert + returning
- softDelete: WHERE id AND workspaceId (both required — prevents cross-workspace delete)

bunfig.toml + test-setup.ts added to packages/shared for env var preloading.
12 new tests (7 keyVault + 4 virtualKeyRepo + 1 index).

### Day 14 — 2026-06-05
`packages/shared/src/queues/types.ts`:
- IngestionJobData interface (requestId, virtualKeyId, workspaceId, provider, model, envTag, featureTag, userIdTag, tokensIn, tokensOut, latencyMs, statusCode, createdAt)

`packages/shared/src/queues/definitions.ts`:
- BullMQ Queue('ingestion') — host/port from DRAGONFLY_URL, no IORedis instance (avoids version mismatch with bullmq's own ioredis)
- Untyped Queue — IngestionJobData enforced at call site by buildIngestionJob return type

`gateway/src/handlers/ingestionJob.ts`:
- buildIngestionJob: WorkspaceContext + ParsedBody + response usage → IngestionJobData
- ctx.realApiKey intentionally excluded from output

`gateway/src/handlers/proxy.ts`:
- Non-streaming: transformRequest → fetch → transformResponse → fire-and-forget ingestionQueue.add → c.json
- Provider not found → ProviderError 400, providerRes not ok → ProviderError(providerRes.status)

`gateway/src/handlers/stream.ts`:
- Streaming: same fetch path → stream(c, ...) → SSE passthrough via reader/decoder
- Best-effort usage extraction from SSE chunks containing '"usage"'
- Fire-and-forget ingestionQueue.add after stream complete

`gateway/src/index.ts`:
- Replaced 501 stub with `if (c.get('isStreaming')) return streamHandler(c); return proxyHandler(c)`
- App type updated to `Hono<{ Variables: GatewayVariables }>`

6 new proxy handler tests. All 3 middleware mocks updated with ProviderError to prevent Bun module re-evaluation poisoning across test files.

### Day 13 — 2026-06-05
WorkspaceContext type (`packages/shared/src/types.ts`):
```
{ workspaceId, virtualKeyId, realApiKey, provider, budgetCap: number | null }
```
Exported from @tokenlens/shared barrel (safe — no env.ts dependency).

Subpath exports added to packages/shared/package.json:
- @tokenlens/shared/keyVault → src/services/keyVault.ts
- @tokenlens/shared/virtualKeyRepo → src/db/repositories/virtualKeyRepo.ts
(NOT barrel-exported — keyVault imports env.ts which calls process.exit(1) at load time)

virtualKeyResolver middleware (`gateway/src/middlewares/virtualKeyResolver.ts`):
1. Extract + validate Authorization: Bearer tl-vk-* (format check BEFORE any IO)
2. DragonflyDB cache lookup: vk:{virtualKeyId}, TTL 300s
3. Cache hit → JSON.parse → c.set('ctx') → next()
4. Cache miss → findById → AuthError if null → decrypt(encrypted_key)
5. Build WorkspaceContext → setex(cacheKey, 300, JSON.stringify(ctx)) → c.set('ctx') → next()
realApiKey cached in DragonflyDB intentionally (internal infra only).

GatewayVariables updated with ctx: WorkspaceContext.
8 new tests (cache hit, cache miss x2, auth failures x3, security x2).
Total: 41 gateway tests passing.

---

## Stub / not started

| File | Status |
|------|--------|
| gateway/src/middlewares/budgetEnforcer.ts | stub — awaits INCRBYFLOAT logic |
| gateway/src/index.ts POST handler | DONE — proxyHandler/streamHandler wired |
| worker/ | not started |
| web/ | Next.js scaffold only |

---

## Key architectural decisions

- **No barrel export for keyVault/virtualKeyRepo**: both transitively load env.ts (process.exit on missing vars). Use subpath exports instead so gateway test process never evaluates them.
- **WorkspaceContext in shared/types.ts**: no dependencies — safe to barrel-export. Avoids circular type issues.
- **softDelete dual-condition**: always filters by BOTH id AND workspaceId — cross-workspace delete impossible.
- **realApiKey in DragonflyDB cache**: accepted tradeoff — DragonflyDB is internal, avoids Postgres on every request.
- **Bun module cache poisoning fix (Day 11)**: all @tokenlens/shared mocks must be comprehensive (include RateLimitError, ValidationError, dragonflyClient.pipeline) regardless of test execution order.
