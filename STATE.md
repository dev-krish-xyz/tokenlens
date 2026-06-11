Day 24 | 2026-06-11
Done: budgetEnforcer middleware (real INCRBYFLOAT enforcement, 429 before provider call), budget tRPC router (key + workspace status), budget dashboard page with color-coded progress bars
Tests: 38 shared / 58 gateway / 5 worker — all passing. tsc clean on gateway, web.
Next: Day 25 (TBD)

---

## Completed days

### Day 24 — 2026-06-11
`gateway/src/middlewares/budgetEnforcer.ts` (replaced stub):
- `getBudgetCap(ctx.workspaceId)` — DragonflyDB-cached workspace cap
- Fast path: both caps null → `next()` immediately, no spend read (common case, <1ms)
- `getRemainingBudget(virtualKeyId, workspaceId, keyCap, wsCap)` — single mget round trip
- Key cap check: `keyRemaining <= 0` → BudgetExceededError with formatted message including Spent and Cap
- Workspace cap check: `wsRemaining <= 0` → BudgetExceededError; fires independently of key cap
- Provider never called when 429 returned — no billing charge

`web/src/server/api/routers/budget.ts` (new):
- `getKeyBudgetStatus`: findByWorkspace → filter budget_cap !== null → parallel getCurrentSpend → `{ keyId, keyName, provider, spend, cap, remaining, percentage }`
- `getWorkspaceBudgetStatus`: getBudgetCap → null shortcut → getCurrentSpend('_', wsId) → `{ cap, spend, remaining, percentage }` or null
- Both use protectedMemberProcedure

`web/src/app/(dashboard)/dashboard/budget/page.tsx` (new):
- Workspace budget card (if cap set): progress bar, green/yellow/red at 80%/100%
- Per-key budget cards: provider badge, same color coding
- Empty state: links to /dashboard/keys and /dashboard/settings when no caps configured

`web/src/components/DashboardNav.tsx`: Budget → /dashboard/budget nav item added
`web/src/server/api/root.ts`: `budget: budgetRouter` added to appRouter

Design notes:
- Fast path skip of spend read is the hot path optimization — most keys have no caps
- Both key cap and workspace cap are independent hard limits — either one at or below zero returns 429
- `keyRemaining <= 0` not `< 0` — exactly zero means the cap is exhausted
- wsCap changes take effect within 300s due to getBudgetCap TTL (documented SLA from Day 23)

### Day 23 — 2026-06-11
`packages/shared/src/services/budgetService.ts`:
- `incrementSpend(virtualKeyId, workspaceId, costUsd)`: skip if costUsd ≤ 0; pipeline INCRBYFLOAT on `spend:key:{YYYYMM}:{keyId}` + `spend:ws:{YYYYMM}:{wsId}`; EXPIRE 35 days (idempotent TTL reset)
- `getCurrentSpend(virtualKeyId, workspaceId)`: `dragonflyClient.mget` both keys in one call; returns floats (0 if key missing)
- `getRemainingBudget(virtualKeyId, workspaceId, keyCap, wsCap)`: skips DragonflyDB entirely when both caps null (hot path optimization)
- New subpath export: `@tokenlens/shared/services/budgetService`

`packages/shared/src/db/repositories/workspaceRepo.ts`:
- `getBudgetCap(workspaceId)`: DragonflyDB `wscap:{workspaceId}` → Postgres fallback → cache result 300s; null cap stored as string `'null'` (distinguishable from cache miss)
- `invalidateBudgetCapCache(workspaceId)`: DEL `wscap:{workspaceId}`

`worker/src/queues/ingestionProcessor.ts`:
- After `clickhouseWriter.add()`: call `await incrementSpend(virtualKeyId, workspaceId, costUsd)` in try-catch; failure logged but non-fatal (analytics not held hostage to counter updates)

`worker/src/queues/ingestionProcessor.test.ts`:
- Added `mock.module('@tokenlens/shared/services/budgetService', ...)` — prevents real DragonflyDB calls in tests

`web/src/server/api/routers/workspace.ts`:
- `updateBudgetCap` procedure now calls `invalidateBudgetCapCache(ctx.workspaceId)` after Postgres update — stale cap evicted immediately

`packages/shared/src/services/budgetService.test.ts`:
- 15 tests covering incrementSpend (zero skip, key format, TTL), getCurrentSpend (cache miss, floats), getRemainingBudget (no-cap shortcut, over-budget negative), getBudgetCap (cache hit/miss, null cap serialization)

Design notes:
- INCRBYFLOAT is atomic — no locking needed; both increments in single pipeline round-trip
- EXPIRE idempotent on every increment — active keys stay warm without cron cleanup
- `'null'` string sentinel prevents cache miss vs. null budget cap ambiguity
- incrementSpend non-fatal in worker — ClickHouse analytics must not fail if DragonflyDB is momentarily unavailable

### Day 22 — 2026-06-11
`packages/shared/src/types.ts`:
- `WorkspaceRole` type: `'admin' | 'member' | 'viewer'`
- `ROLE_HIERARCHY`: `{ admin: 3, member: 2, viewer: 1 }` — numeric comparisons
- `hasMinimumRole(userRole, required)`: pure function, barrel-exported

`packages/shared/src/db/repositories/workspaceMemberRepo.ts` (new):
- `getRoleForUser(workspaceId, userId)`: inner join workspace_members + workspaces, returns role or null
- `listMembers(workspaceId)`: joins workspace_members + users, returns `{ userId, email, name, role, joinedAt }`
- `updateRole(workspaceId, targetUserId, newRole, requestingUserId)`: throws if self-modification attempted
- `removeMember(workspaceId, targetUserId, requestingUserId)`: throws if self-removal attempted
- Subpath export: `@tokenlens/shared/workspaceMemberRepo`

`web/src/server/api/trpc.ts`:
- `userRole: WorkspaceRole | null` added to Context type
- `createContext()` calls `workspaceMemberRepo.getRoleForUser` after workspace lookup
- `protectedMemberProcedure`: extends protectedWorkspaceProcedure, requires `hasMinimumRole(role, 'member')`
- `protectedAdminProcedure`: extends protectedWorkspaceProcedure, requires `role === 'admin'`

`web/src/server/api/routers/workspace.ts` (new):
- `getSettings`: protectedWorkspaceProcedure — returns id, name, plan, budgetCap (decimal→float), memberCount
- `updateName`: protectedAdminProcedure — min 1 / max 100
- `updateBudgetCap`: protectedAdminProcedure — positive or null; clears wscap cache
- `listMembers`: protectedMemberProcedure — full member list with roles
- `updateMemberRole`: protectedAdminProcedure — enum('member','viewer') only; no admin promotion in MVP
- `removeMember`: protectedAdminProcedure — triggers self-removal guard in repo

`web/src/server/api/routers/virtualKey.ts`:
- `create` + `delete` upgraded from protectedWorkspaceProcedure → protectedMemberProcedure

`web/src/app/(dashboard)/dashboard/settings/page.tsx` (new):
- Workspace name + budget cap inputs with inline Save/error/success states
- Team members table with role badges (admin purple, member blue, viewer gray)
- Inline role `<select>` for non-admin members; remove confirmation modal
- Server enforces RBAC — client shows inputs for all roles (FORBIDDEN surfaces as inline error)

`web/src/components/DashboardNav.tsx`: Settings nav link added

Design notes:
- Role checks EXCLUSIVELY in procedure middleware — service functions role-agnostic
- Admin role not assignable via updateMemberRole (only one admin per workspace, set at creation)
- decimal budget_cap from Postgres → parseFloat() in router, String() on write

### Day 21 — 2026-06-07
`scripts/e2e.test.ts`:
- Step 1: Postgres tables exist (6), model_pricing has 10 seed rows, ClickHouse request_logs exists, DragonflyDB pongs
- Step 2: Create workspace+user+member directly in DB; encrypt/decrypt virtual key (AES-256-GCM); virtualKeyRepo.findById; DragonflyDB cache miss→populate→hit cycle
- Step 3: Gateway health 200; no-auth 401; invalid-key-format 401; SSRF base_url 400 (requestValidator fires before virtualKeyResolver); rate limit 60→200 then 429
- Step 4: Enqueue IngestionJobData directly to BullMQ; wait 5s; verify ClickHouse row; verify gpt-4o-mini cost 0.000045 (100 in + 50 out, tolerance 0.000001)
- Step 5: getDailySpend for E2E workspace > 0; getPerCustomerCost finds e2e-customer-1; workspace isolation (non-existent ID → empty)
- afterAll: cleans all Postgres test rows; DragonflyDB cache key; ClickHouse rows left with featureTag='e2e-test'; `process.exit(0)` force-closes all connections

`scripts/test-setup.ts`: env var defaults for local docker-compose stack
`scripts/tsconfig.json`: extends tsconfig.base.json; paths for all @tokenlens/shared subpath imports
`scripts/package.json`: workspace package `@tokenlens/scripts`; drizzle-orm pinned to 0.43.1 to match packages/shared
`bunfig.toml` (root): `[test] preload = ["./scripts/test-setup.ts"]`

Design notes:
- virtualKeyId uses `crypto.randomUUID()` (not generateVirtualKeyId) — virtual_keys.id is uuid type in Postgres; tl-vk- prefix would fail constraint
- SSRF test works with UUID bearer because requestValidator (#3) runs before virtualKeyResolver (#4)
- Root bunfig.toml preload only affects `bun test` run from repo root; per-package tests use their own bunfig.toml

### Day 20 — 2026-06-07
`packages/shared/src/clickhouse/queries.ts`:
- `getRequestLogs(workspaceId, filters)`: parameterized WHERE with optional model/provider/userId, ORDER BY created_at DESC, LIMIT/OFFSET pagination
- `getRequestLogCount(workspaceId, filters)`: same optional filters, SELECT count() for pagination total
- `getPerCustomerCost(workspaceId, days)`: GROUP BY user_id_tag, topK(1)(model)[1], user_id_tag != '' guard, LIMIT 50
- Shared `buildConditions()` helper — no string interpolation anywhere

`web/src/server/api/routers/cost.ts`:
- `getRequestLogs`: parallel Promise.all([getRequestLogs, getRequestLogCount]) → { rows, total }
- `getPerCustomerCost`: calls getPerCustomerCost(ctx.workspaceId, input.days)

`web/src/app/(dashboard)/dashboard/logs/page.tsx`:
- URL-synced filters: days (parseAsInteger, default 7), model, provider, userId, page
- Debounced text inputs (300ms, skip-on-mount ref pattern) for model + userId
- Filter bar: date toggle, model input, provider select, userId input, Clear filters button
- Table: Time (relative, title tooltip) / Provider (badge) / Model (truncated) / Tokens In / Tokens Out / Cost ($X.XXXXXX) / Latency (color: <500ms green, 500-2000 yellow, >2000 red) / Status (badge: 200 green, 4xx yellow, 5xx red) / Env / User ID (20-char truncate with tooltip)
- Pagination: Showing X–Y of Z, Previous/Next with disable logic

`web/src/app/(dashboard)/dashboard/customers/page.tsx`:
- URL-synced days (parseAsInteger, default 30)
- Table: Customer ID / Total Cost / Requests / Avg Cost/Req / Avg Latency / Top Model
- Top 3 by cost → red-tinted row background
- Empty state with curl code snippet showing X-TL-User-Id header usage

`web/src/components/DashboardNav.tsx`:
- Added Logs → /dashboard/logs and Customers → /dashboard/customers

### Day 19 — 2026-06-06
`web/src/features/cost-dashboard/useDateRange.ts`:
- `useDateRange()`: nuqs `useQueryState('days', parseAsInteger.withDefault(7))` — URL-synced, shareable

`web/src/features/cost-dashboard/SummaryCards.tsx`:
- 4-card 2x2 grid (md: 4-col): Total Spend ($X.XXXX), Total Requests, Avg Latency, Models Used
- Empty state banner with link to /dashboard/keys when totalRequests === 0
- Skeleton loading state

`web/src/features/cost-dashboard/DailySpendChart.tsx`:
- Recharts AreaChart, x-axis: "Jun 5" format, y-axis: $X.XXXX
- Gradient fill (indigo-600 @ 20% opacity), custom tooltip with date + cost + requests
- Skeleton and "No spend data" empty state

`web/src/features/cost-dashboard/TopModelsTable.tsx`:
- 5-column table: Model / Provider (badge) / Total Cost / Requests / Avg Cost/Req
- Avg Cost/Req to 6 decimal places, slice(0, 10) safety cap
- Provider badges match keys page (blue/orange/green), 3 skeleton rows

`web/src/app/(dashboard)/dashboard/page.tsx`:
- Replaced server-component placeholder with client component
- Page header + [7d][30d][90d] toggle → setDays() → URL update
- SummaryCards + DailySpendChart + TopModelsTable, each fetches own data independently

`web/src/app/(dashboard)/layout.tsx`:
- Added NuqsAdapter (nuqs/adapters/next) outermost wrapper — required for useQueryState

Packages added: nuqs@2.8.9, recharts@3.8.1 (types bundled, @types/recharts removed).

### Day 18 — 2026-06-06
`packages/shared/src/db/repositories/virtualKeyRepo.ts`:
- `updateBudget(id, workspaceId, budgetCap)`: UPDATE with dual-condition WHERE (id + workspaceId), strips encrypted_key, returns SafeVirtualKey | null

`web/src/server/api/routers/virtualKey.ts`:
- `create`: validates realApiKey not tl-vk- prefix, encrypt(), virtualKeyRepo.create(), strips encrypted_key from return
- `list`: findByWorkspace — encrypted_key already excluded by repo
- `delete`: softDelete(id, ctx.workspaceId) — ownership enforced by dual-condition
- `updateBudget`: calls repo updateBudget, throws NOT_FOUND if null

`web/src/app/(dashboard)/dashboard/keys/page.tsx`:
- Table: Name / Provider (badge) / Budget Cap / Created / Delete action
- Create modal: name + provider select + password input + optional budget cap
- Reveal modal: shows key ID once with copy button + "Save this key" warning
- Delete confirm modal with AlertDialog-style confirm/cancel
- tRPC invalidation on create success (reveal done) and delete success

`web/src/components/DashboardNav.tsx`:
- Client component, usePathname() for active state
- Links: Dashboard (/dashboard) + API Keys (/dashboard/keys)

`web/src/app/(dashboard)/layout.tsx`:
- Added DashboardNav to header

`web/src/server/api/root.ts`:
- Added virtualKey: virtualKeyRouter to appRouter

Security: `encrypted_key` never appears in any tRPC response — stripped at repo layer (`findByWorkspace`, `updateBudget`) or stripped in router after `create` (`const { encrypted_key: _omit, ...safe } = row`).
drizzle-orm version mismatch fix: updateBudget moved to packages/shared/virtualKeyRepo (same drizzle version as the schema) instead of inline in web router.

### Day 17 — 2026-06-06
`packages/shared/src/clickhouse/queries.ts`:
- `getDailySpend(workspaceId, days)`: daily cost + request count aggregation, ordered ASC
- `getTopModels(workspaceId, days)`: top 10 models by cost, grouped by model+provider
- `getSummaryStats(workspaceId, days)`: totalCost, totalRequests, avgLatencyMs, uniqueModels
- All queries: parameterized `{workspaceId: String}` and `{days: UInt32}` — no string interpolation
- Subpath export: `@tokenlens/shared/clickhouse/queries`

`web/src/server/api/trpc.ts`:
- `Context` type: `{ session: Session | null; workspaceId: string | null }`
- `createContext()`: getSession() + findByUserId() — workspaceId from server, never client
- `protectedWorkspaceProcedure`: throws UNAUTHORIZED/FORBIDDEN, narrows ctx to non-null session+workspaceId
- Exports: `router`, `publicProcedure`, `createCallerFactory`

`web/src/server/api/routers/cost.ts`:
- `getDailySpend`, `getTopModels`, `getSummaryStats` — all use `protectedWorkspaceProcedure`
- Input: `z.object({ days: z.number().int().min(1).max(90).default(7) })`
- workspaceId always from ctx — never accepted as client input

`web/src/server/api/root.ts`:
- `appRouter` with `cost: costRouter`
- `AppRouter` type exported for client inference

`web/src/app/api/trpc/[trpc]/route.ts`:
- `fetchRequestHandler` with GET + POST exports
- `createContext: () => createContext()` — fresh context per request

`web/src/trpc/client.ts` — `createTRPCReact<AppRouter>()` (client components)
`web/src/trpc/server.ts` — `getServerCaller()` using `createCallerFactory` (server components only)
`web/src/trpc/provider.tsx` — `TRPCProvider` with QueryClient + httpBatchLink → /api/trpc

`web/src/app/(dashboard)/layout.tsx`:
- Wrapped children with `TRPCProvider` (outermost) → `WorkspaceProvider`

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

### Day 15 — 2026-06-05
`packages/shared/src/dragonfly/bullmqClient.ts`:
- `dragonflyClientForBullMQ` — host/port plain object, barrel-exported. No IORedis instance (avoids version mismatch).

`packages/shared/src/clickhouse/writer.ts`:
- `ClickhouseWriter` class: buffer[], setInterval 2s flush, batchSize 200
- `clickhouseWriter` singleton instance exported from subpath `@tokenlens/shared/clickhouse/writer`

`packages/shared/src/db/repositories/pricingRepo.ts`:
- `findByPattern(provider, model)`: DragonflyDB cache → Postgres regex match → cache result (TTL 3600, including null)
- Null result cached to prevent repeated DB hits for unknown models

`packages/shared/src/services/costCalculator.ts`:
- `calculateCost(tokensIn, tokensOut, pricing)`: pure function, returns 0 if pricing null
- Barrel-exported from @tokenlens/shared

`worker/src/queues/ingestionProcessor.ts`:
- `processIngestionJob(job)`: findByPattern → calculateCost → clickhouseWriter.add(RequestLogRow)
- Errors propagate — BullMQ handles retries

`worker/src/index.ts`:
- Worker('ingestion', processIngestionJob, { connection: dragonflyClientForBullMQ, concurrency })
- SIGTERM: ingestionWorker.close() + clickhouseWriter.flush() before exit
- Event handlers: completed/failed — job.data never logged

Bun module poisoning fix: drizzle-orm mock in any shared test must include {eq, and, desc}.
New subpath exports: @tokenlens/shared/pricingRepo, @tokenlens/shared/clickhouse/writer.

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

### Day 16 — 2026-06-06
`packages/shared/src/db/repositories/workspaceRepo.ts`:
- `createWithAdmin(userId, userEmail)`: Drizzle transaction → insert workspace + users (onConflictDoNothing) + workspace_members{role:'admin'}
- `findByUserId(userId)`: innerJoin workspace_members → workspaces, LIMIT 1
- `findById(id)`: basic select by PK
- Subpath export: `@tokenlens/shared/workspaceRepo`

`web/src/lib/auth-schema.ts`:
- Better Auth tables: ba_users, ba_sessions, ba_accounts, ba_verifications
- Columns match Better Auth's camelCase internal names (emailVerified, createdAt, updatedAt) mapped to snake_case DB columns

`web/src/lib/auth-db.ts`:
- Drizzle node-postgres instance using BA schema tables only

`web/src/lib/auth.ts`:
- betterAuth with drizzleAdapter → ba_* tables
- advanced.database.generateId = 'uuid' — compatible with shared users.id (uuid pg type)
- emailAndPassword enabled
- Google OAuth conditional on GOOGLE_CLIENT_ID/SECRET env vars
- databaseHooks.user.create.after → createWithAdmin(user.id, user.email)

`web/src/app/api/auth/[...all]/route.ts`:
- toNextJsHandler(auth) → GET + POST export

`web/src/lib/auth-client.ts`:
- createAuthClient → signIn, signUp, signOut, useSession exports

`web/src/lib/session.ts`:
- `getSession()`: server-side via auth.api.getSession + next/headers
- `requireSession()`: redirects /login if no session
- `requireWorkspace()`: requireSession + findByUserId, redirects /login if no workspace

`web/src/providers/WorkspaceProvider.tsx`:
- Client component, WorkspaceContext with workspace: Workspace
- `useWorkspace()` hook throws if used outside provider

`web/src/app/(auth)/login/page.tsx` + `register/page.tsx`:
- email+password forms + Google OAuth button (always present)
- shadcn/ui-style Tailwind components

`web/src/app/(dashboard)/layout.tsx`:
- Server component, calls requireWorkspace(), wraps with WorkspaceProvider
- Header showing workspace.name

`web/src/app/(dashboard)/dashboard/page.tsx`:
- Placeholder with user welcome + "Analytics coming soon"

Tailwind CSS v4 setup: postcss.config.mjs + globals.css with `@import "tailwindcss"`.
env.ts: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, STRIPE_*, RESEND_API_KEY all optional.
web/tsconfig.json: added allowImportingTsExtensions: true.
Run `bunx better-auth migrate` to create ba_* tables in Postgres before first use.

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
| gateway/src/middlewares/budgetEnforcer.ts | DONE — Day 24 |
| gateway/src/index.ts POST handler | DONE — proxyHandler/streamHandler wired |
| worker/ | DONE — ingestionProcessor + index.ts with SIGTERM shutdown |
| web/ | Next.js scaffold only |

---

## Key architectural decisions

- **No barrel export for keyVault/virtualKeyRepo**: both transitively load env.ts (process.exit on missing vars). Use subpath exports instead so gateway test process never evaluates them.
- **WorkspaceContext in shared/types.ts**: no dependencies — safe to barrel-export. Avoids circular type issues.
- **softDelete dual-condition**: always filters by BOTH id AND workspaceId — cross-workspace delete impossible.
- **realApiKey in DragonflyDB cache**: accepted tradeoff — DragonflyDB is internal, avoids Postgres on every request.
- **Bun module cache poisoning fix (Day 11)**: all @tokenlens/shared mocks must be comprehensive (include RateLimitError, ValidationError, dragonflyClient.pipeline) regardless of test execution order.
