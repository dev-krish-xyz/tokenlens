# TokenLens — Claude Code Context File

## Project
AI cost governance SaaS. Proxy gateway + analytics dashboard.
Stack: TypeScript monorepo. Hono gateway / Next.js 15 web / BullMQ worker.
DB: ClickHouse (analytics) + PostgreSQL (users/config) + DragonflyDB (cache/queues).

## Monorepo structure
```
tokenlens/
├── gateway/          ← Hono proxy (port 8787)
├── web/              ← Next.js 15 dashboard (port 3000)
├── worker/           ← BullMQ async processor (port 3001)
└── packages/shared/  ← Drizzle schema, ClickHouse client, types
```

## Critical conventions
- Layering: Route → Service → Repository → DB. Never skip layers.
- tRPC for dashboard UI calls. REST for public gateway API. Same service layer underneath.
- ClickHouse = request logs only. Postgres = users/keys/workspaces/config.
- All async work goes in BullMQ jobs — never block request handlers.
- Virtual keys encrypted AES-256-GCM. Real provider API keys never logged.
- DragonflyDB is the cache/queue. Never call it "Redis" in code or comments.
- ALWAYS run tests after changes: `bun test --cwd [package]`

## Gateway middleware chain (exact order — do not reorder)
1. `requestIdMiddleware` — nanoid, sets `c.set('requestId')` + header `X-Request-Id`
2. `rateLimiter` — DragonflyDB sliding window
3. `requestValidator` — Zod body shape + SSRF IP check
4. `virtualKeyResolver` — DragonflyDB cache → Postgres decrypt → `c.set('ctx')`
5. `budgetEnforcer` — INCRBYFLOAT check → 429 BEFORE provider call
6. `providerProxy` — actual LLM call (stream or JSON)

After response: async log push to DragonflyDB queue (non-blocking)

## Cache key registry (DragonflyDB)
- `vk:{virtualKeyId}` — resolved key context (provider key stored encrypted, decrypted per request), TTL 300s
- `spend:key:{YYYYMM}:{virtualKeyId}` — monthly spend counter, TTL 35d
- `spend:ws:{YYYYMM}:{workspaceId}` — workspace monthly spend, TTL 35d
- `wscap:{workspaceId}` — workspace budget cap, TTL 300s
- `alert:sent:{virtualKeyId}:{YYYYMMDDHH}` — dedup flag, TTL 1h
- `rl:{ip}:{minute}` — rate limit window

## Current build state
Day 19 complete.
Done: monorepo scaffold, docker-compose, Drizzle+ClickHouse schema, Zod env validation, GitHub Actions CI, Hono gateway with full middleware chain, OpenAI/Anthropic/Gemini providers, KeyVault, virtualKeyRepo (+ updateBudget), WorkspaceContext, proxyHandler, streamHandler, buildIngestionJob, BullMQ ingestionQueue, pricingRepo (cache→regex match), costCalculator (pure), ClickhouseWriter (buffer+flush 2s/200), ingestionProcessor, worker/src/index.ts (SIGTERM graceful shutdown), Better Auth (email+password+Google OAuth), workspaceRepo, auth pages (login/register), protected dashboard layout, WorkspaceProvider, tRPC v11 (protectedWorkspaceProcedure, cost router, virtualKey router), ClickHouse query service (getDailySpend/getTopModels/getSummaryStats), TRPCProvider in dashboard layout, /dashboard/keys page (create/list/delete with reveal dialog), DashboardNav sidebar, dashboard analytics UI (SummaryCards + DailySpendChart + TopModelsTable + URL-synced date range via nuqs).
Working: 47 gateway / 23 shared / 5 worker tests passing, tsc clean on all packages.
Broken/stubbed: none — budgetEnforcer now does atomic INCRBYFLOAT reserve-then-check (worker adjusts estimate to actual via adjustSpend). Gateway env TRUST_PROXY_HEADERS gates forwarding-header trust for rate limiting (default false). ClickHouse virtual_key_id stores hashVirtualKeyId() digest, never the raw tl-vk token. Provider-chain hardening: Gemini key sent via x-goog-api-key header (never URL; model URL-encoded), vk:* cache keeps provider key encrypted (decrypt per request), upstream error statuses map to generic 502 (429 passes through), mid-stream upstream error events replaced with generic SSE event. tRPC router hardening: virtualKey create/delete/updateBudget are admin-only, errorFormatter masks INTERNAL_SERVER_ERROR messages + strips stacks, repos throw AppError subclasses (ValidationError → BAD_REQUEST via rethrowAsTRPC in workspace router), invite emails lowercased, ids validated .uuid(), budget router logic lives in @tokenlens/shared/services/budgetStatusService. Run `bunx better-auth migrate` in web/ before first use to create ba_* tables.
Shared subpath exports: @tokenlens/shared/keyVault, @tokenlens/shared/virtualKeyRepo, @tokenlens/shared/pricingRepo, @tokenlens/shared/clickhouse/writer, @tokenlens/shared/clickhouse/queries, @tokenlens/shared/queues/definitions, @tokenlens/shared/queues/types, @tokenlens/shared/workspaceRepo, @tokenlens/shared/workspaceMemberRepo, @tokenlens/shared/alertConfigRepo, @tokenlens/shared/inviteRepo, @tokenlens/shared/services/budgetService, @tokenlens/shared/services/budgetStatusService.
Next session: request logs table (Developer View) — Day 20

## Do not touch
- `packages/shared/src/db/schema.ts` — only via drizzle-kit migrate
- `gateway/src/providers/*` — follow existing provider module pattern exactly
- `.env*` files — never commit, always use `.env.example`

## Test commands
```bash
bun test               # all packages
bun test --cwd web     # web only
bun dev                # start all (docker compose up first)
```
