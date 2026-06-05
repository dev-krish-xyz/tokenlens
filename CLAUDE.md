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
- `vk:{virtualKeyId}` — resolved key context, TTL 300s
- `spend:key:{YYYYMM}:{virtualKeyId}` — monthly spend counter, TTL 35d
- `spend:ws:{YYYYMM}:{workspaceId}` — workspace monthly spend, TTL 35d
- `wscap:{workspaceId}` — workspace budget cap, TTL 300s
- `alert:sent:{virtualKeyId}:{YYYYMMDDHH}` — dedup flag, TTL 1h
- `rl:{ip}:{minute}` — rate limit window

## Current build state
Day 14 complete.
Done: monorepo scaffold, docker-compose, Drizzle+ClickHouse schema, Zod env validation, GitHub Actions CI, Hono gateway with full middleware chain (requestId, rateLimiter, requestValidator, virtualKeyResolver), OpenAI/Anthropic/Gemini providers, KeyVault service (AES-256-GCM), virtualKeyRepo, WorkspaceContext type, subpath exports, proxyHandler (non-streaming), streamHandler (SSE passthrough + best-effort usage extraction), buildIngestionJob helper, BullMQ ingestionQueue (shared), gateway POST handler wired end-to-end.
Working: 47 gateway tests passing, 12 shared tests passing, tsc clean on all packages.
Broken/stubbed: budgetEnforcer (stub — needs INCRBYFLOAT logic), worker (not started), web (Next.js scaffold only).
Shared subpath exports: @tokenlens/shared/keyVault, @tokenlens/shared/virtualKeyRepo, @tokenlens/shared/queues/definitions, @tokenlens/shared/queues/types.
Next session: budgetEnforcer middleware

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
