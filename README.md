# CLAUDE.md — TokenLens Engineering OS

> Read this + STATE.md at every session start. Then wait for the task.

---

## 1. Identity

**TokenLens** — AI cost governance proxy gateway. Intercepts LLM API calls. Attributes cost by team/dev/env/feature/customer. Enforces hard budget caps via 429 **before** the provider call.

**Moat:** per-customer margin visibility + hard enforcement. Not dashboards-after-the-fact.
**Not:** a dashboard, an observability tool, a router. A **control plane** that owns the request path.

**Owner:** Krishna (solo, 1-3 hrs/day). **Copilot:** Claude Pro.
**Timeline:** 30-day MVP → self → 5 design partners from X/HN.
**Providers v1:** OpenAI, Anthropic, Gemini.
**Non-goals (v2+):** semantic routing, multi-region, on-prem, prompt caching, NATS migration, model leaderboards.

---

## 2. Stack (canonical — never drift without ADR)

```
Runtime       Bun >=1.2          gateway, worker, package manager, test runner
Gateway       Hono v4            hot path, <3ms overhead target
Web           Next.js 15         App Router only
Internal API  tRPC v11           web ↔ web backend only
External API  REST /v1           OpenAI-compatible format, gateway only
ORM           Drizzle + drizzle-kit   Postgres only, TypeScript schema
Postgres      Neon               serverless, branch per PR
Analytics     ClickHouse Cloud   ReplacingMergeTree, daily partitions
Cache+Queue   DragonflyDB        Redis-protocol, multi-threaded, single instance
Queue lib     BullMQ             on DragonflyDB — zero code diff from Redis
Auth (web)    Better Auth        Drizzle adapter + org plugin
Auth (gw)     Virtual key        AES-256-GCM encrypted at rest, decrypt in memory <5ms
Validation    Zod                shared: gateway + web + worker
UI            shadcn/ui + Tailwind + nuqs (URL-synced filter state)
Tests         bun test           Jest-compatible, colocated *.test.ts
Monorepo      Bun workspaces + Turborepo (task caching, parallel builds)
Deploy        Fly.io (gateway) · Vercel (web) · Railway (worker + DragonflyDB)
Email         Resend
Payments      Stripe             Checkout + webhooks
CI            GitHub Actions     setup-bun → typecheck → bun test → deploy
```

**Forbidden:** Prisma · Redis · pnpm · npm · Vitest · Express · Axios · NextAuth · raw SQL outside `db/raw/` · ORM calls in routes.
**Requires explicit OK before adding:** dependency >50KB · new service · new DB · new deploy target · migration touching >2 tables.

---

## 3. Repo Layout

```
tokenlens/
├── CLAUDE.md / STATE.md / JOURNAL.md / docs/adr/
├── turbo.json
├── docker-compose.dev.yml        # DragonflyDB + ClickHouse + Postgres (local)
├── .github/workflows/ci.yml
├── gateway/
│   ├── Dockerfile                # FROM oven/bun:1.2-alpine — no build step needed
│   ├── fly.toml
│   └── src/
│       ├── index.ts              # Hono app + middleware chain (order matters, see §4)
│       ├── middlewares/          # rateLimiter · virtualKeyResolver · budgetEnforcer · requestValidator
│       ├── providers/            # openai/ · anthropic/ · gemini/ — 3 files each
│       └── handlers/             # proxy.ts · stream.ts
├── web/
│   └── src/
│       ├── app/                  # Next.js App Router pages + layouts
│       ├── components/           # shadcn/ui components
│       ├── server/api/           # tRPC routers: cost · keys · budget · team · alert
│       └── lib/auth.ts           # Better Auth config
├── worker/
│   └── src/
│       ├── index.ts              # BullMQ worker bootstrap
│       └── queues/               # ingestion · anomaly · alert · forecast · export
└── packages/shared/
    ├── drizzle.config.ts
    └── src/
        ├── db/schema.ts          # pgTable definitions — SINGLE source of truth
        ├── db/client.ts          # Drizzle client factory (reads DATABASE_URL)
        ├── db/repositories/      # workspaceRepo · virtualKeyRepo · pricingRepo
        ├── clickhouse/           # client.ts · writer.ts (200 rows or 2s batch)
        ├── services/             # budgetService · keyVault · costCalculator
        ├── queues/types.ts       # ALL BullMQ job type definitions (shared producer+consumer)
        ├── errors.ts             # AppError subclass hierarchy (see §6)
        └── env.ts                # Zod-validated env — crash on startup if missing
```

**Layering rule (no exceptions):** Route → Service → Repository → DB.
Routes never import Drizzle. Services never know about HTTP. Repositories are the only layer that imports Drizzle or ClickHouse clients.

---

## 4. Gateway Middleware Chain (this exact order — never reorder)

```
1. rateLimiter          ~0.5ms   DragonflyDB sliding window per IP
2. requestValidator     ~0.2ms   Zod body shape + SSRF check on custom hosts
3. virtualKeyResolver   ~0.5ms   Dragonfly cache hit → else Postgres → re-cache 5min TTL
4. budgetEnforcer       ~0.5ms   INCRBYFLOAT on spend counters → 429 if cap hit ← THE PRODUCT
5. providerProxy        RTT      fetch(providerURL, realKey) + forward stream chunks immediately
6. logAsync             ~0.1ms   push metadata to Dragonfly ingestion queue → fire & forget
```

**Invariants:**
- Steps 1-4 + 6 total < 3ms p99. Provider RTT is not our overhead.
- Budget 429 fires at step 4 — provider never called, zero tokens consumed, zero dollars spent.
- Real provider key: in memory only, <5ms scope, **never logged anywhere**.
- Stream: forward chunks as they arrive. Never buffer full response. Use `stream_options: { include_usage: true }` on all forwarded requests to capture usage from final SSE chunk.
- Error shape (all errors): `{ error: string, code: string, requestId: string }`. Never leak stack traces, internal IPs, or provider keys.

---

## 5. Architecture Rules

1. **One owner per concern.** BudgetService owns counters. CostCalculator owns pricing math. No cross-service duplication.
2. **Shared = library.** No side effects on import. No env reads at module level. Env via `env.ts` at service startup only.
3. **Provider module = 3 files.** `api.ts` (base URL + auth headers) · `chatComplete.ts` (request/response transforms) · `index.ts` (exports). New provider never touches gateway core.
4. **Cache key registry (never invent patterns without updating this list):**
   ```
   vk:{virtualKeyId}                          5min TTL   virtual key context
   spend:key:{YYYYMM}:{virtualKeyId}          35d TTL    per-key budget counter (INCRBYFLOAT)
   spend:ws:{YYYYMM}:{workspaceId}            35d TTL    per-workspace counter  (INCRBYFLOAT)
   pricing:{provider}:{model}                 1h TTL     model pricing lookup
   hourspend:{virtualKeyId}:{YYYYMMDDHH}      2h TTL     anomaly detection baseline
   rate:{ip}                                  window     rate limiter sorted set (ZADD/ZCARD)
   anomaly:sent:{virtualKeyId}:{YYYYMMDDHH}   1h TTL     alert deduplication flag
   ```
5. **Queue jobs are typed.** All job definitions live in `shared/src/queues/types.ts`. Producers and consumers both import from there. Never inline a job shape.
6. **ClickHouse writes batched only.** `ClickhouseWriter` accumulates rows, flushes on 200 rows OR 2s timer — whichever first. Never single-row inserts.
7. **ClickHouse schema contract** (don't modify without ADR):
   `ENGINE = ReplacingMergeTree()` · `PARTITION BY toYYYYMMDD(created_at)` · `ORDER BY (workspace_id, created_at, id)` · `LowCardinality` on provider, model, env_tag.
8. **Data ownership:** Postgres = relational state · ClickHouse = immutable events · DragonflyDB = transient now-state. Don't blur these roles.
9. **Multi-tenancy at repo layer.** Every Postgres query takes `workspaceId`. Every ClickHouse query filters on `workspace_id`. No exceptions. No admin bypass.
10. **Env is fail-fast.** Missing or malformed secret → process exits on startup with clear error message. No silent defaults for secrets or external URLs.
11. **Cost calculation:** `costUsd = (tokensIn / 1_000_000 * inputPrice) + (tokensOut / 1_000_000 * outputPrice)`. Model pricing matched via regex (e.g. `gpt-4o.*`) from Postgres `modelPricing` table, cached 1h in Dragonfly.

---

## 6. Code Standards

- **TypeScript strict.** No `any` without `// any: <reason>` comment.
- **Size limits.** Functions ≤40 lines. Files ≤300 lines. Split by responsibility.
- **Imports order:** stdlib → 3rd party → `@tokenlens/shared` → relative. Blank line between groups.
- **Error hierarchy** (in `shared/src/errors.ts`, use throughout):
  ```ts
  export class AppError extends Error {
    constructor(public code: string, message: string, public status = 500) { super(message); }
  }
  export class BudgetExceededError extends AppError { constructor(m: string) { super('BUDGET_EXCEEDED', m, 429); } }
  export class AuthError extends AppError        { constructor(m: string) { super('UNAUTHORIZED', m, 401); } }
  export class NotFoundError extends AppError    { constructor(m: string) { super('NOT_FOUND', m, 404); } }
  export class ValidationError extends AppError  { constructor(m: string) { super('VALIDATION_ERROR', m, 400); } }
  ```
  Throw from services. Hono `onError` catches all → serializes to `{ error, code, requestId }`.
- **Naming:** `camelCase` files · `kebab-case` route segments · `UPPER_SNAKE` env vars · `snake_case` DB tables and columns · TypeScript objects mirror DB column names exactly.
- **Async:** `Promise.all` for independent ops. Never `await` inside a loop unless order matters.
- **Logging:** structured JSON to stdout. `requestId` on every gateway log entry. Never log secrets, keys, tokens, or full request/response bodies.
- **Comments:** explain *why*, not *what*. Code explains what.
- **Tests:** colocate as `*.test.ts`. Test the contract (inputs/outputs), not the implementation. Use transactional fixtures over DB mocks. Never mock the layer you're testing.
- **Commits:** `type(scope): description`. Types: `feat fix refactor test infra docs chore`. Scopes: `gateway web worker shared ci`. Example: `feat(gateway): add Anthropic provider module`.
- **Schema changes:**
  ```
  1. Edit packages/shared/src/db/schema.ts
  2. bunx drizzle-kit generate   ← read the migration before proceeding
  3. bunx drizzle-kit migrate    ← local first, then Neon
  4. Update affected repositories
  5. bun test
  ```
  Never hand-edit a generated migration file.

---

## 7. AI Operating Rules

### Always
- **Never assume missing context.** Read the file or ask. Hallucinated imports = build break.
- **Diffs not rewrites.** Show the patch. Touch minimum surface.
- **No hidden decisions.** Named a column, picked a pattern, added a dep — say so.
- **No fake logic.** No `// TODO: implement` unless stub was explicitly requested.
- **No unnecessary abstractions.** Inline until the 3rd use. Extract then.
- **Match existing patterns.** Read 2 neighboring files before writing a new one.
- **Surface tradeoffs.** Two viable options → name both, recommend one, explain in one sentence.
- **Preserve §2.** Change request against the stack → stop, surface it, confirm. It's an ADR, not a code change.
- **No output prologue.** Skip "Here's what I did." Show code, name the file, done.
- **Risk note.** If the code has a real tradeoff (stale cache, missing retry, sync-only for now), flag it in one line after the code.

### Never
- Generate a whole file when a function was asked for.
- Add `dotenv` `nodemon` `ts-node` — Bun handles natively.
- Suggest extra tests, extra refactors beyond what was asked.
- Apologize, hedge, or add filler sentences.
- Inline a BullMQ job shape — always import from `queues/types.ts`.
- Call Dragonfly "Redis" in code comments or variable names — use "dragonfly" or "cache".

### Output format (default)
```
[1-line plan]
[file: path/to/file.ts]
[code block]
[⚠ 1-line risk note — only if real tradeoff exists]
```

### Response length budget
| Type | Max |
|---|---|
| Quick code answer | ≤30 lines |
| Multi-file feature | ≤80 lines including code |
| Architecture question | ≤8 bullets |
| Deep investigation | read → summarize findings → ask before generating |
| Bug fix | show only the changed lines + 3 lines context each side |

---

## 8. Forbidden Drift

On any of these suggestions, respond: *"Conflicts with §2. [Canonical reason]. Override?"*

| Suggestion | Answer |
|---|---|
| "Use Prisma here" | No. Drizzle. If migration is hard, write raw SQL in `db/raw/`. |
| "Add Redis separately" | No. DragonflyDB is Redis. One service. |
| "Split this into a microservice" | No. 3 services total. That's the architecture budget. |
| "Add feature flags" | No. Env vars until 100 paying customers. |
| "Cache this in-process memory" | No. Gateway is stateless. Cache in Dragonfly. |
| "Use server actions for this" | No. tRPC for web-internal, REST for external. |
| "Generic event bus" | No. Named BullMQ queues with typed payloads. |
| "Wrap fetch in an HTTP client class" | No. Raw `fetch` with a helper function if needed. |
| "Add Zustand or Redux" | No. nuqs → React state → justify global store explicitly. |
| "New deploy target" | No. Fly/Vercel/Railway. New target needs explicit confirm + ADR. |
| "Add a logging library" | No. `console.log(JSON.stringify({...}))` to stdout. Structured. Done. |
| "Abstract the ClickHouse schema" | No. Raw `@clickhouse/client` via `ClickhouseWriter`. No ORM for analytics. |

---

## 9. Context System

| File | Update | Purpose |
|---|---|---|
| `CLAUDE.md` | Never mid-build | Constitution. Architecture. Rules. |
| `STATE.md` | Every session end | Day N · active slice · schema version · last shipped · next 2 tasks · known bugs · open decisions · drift watch. ≤200 lines. |
| `JOURNAL.md` | Append only | One paragraph per day. Historical record. Read-only for Claude. |
| `docs/adr/NNNN.md` | Per non-obvious decision | Context → Decision → Alternatives → Consequences. ≤30 lines each. |

**Session read order:** CLAUDE.md → STATE.md → relevant ADR(s) → relevant code file(s). Never the whole repo.

**ADR triggers:** choosing between 2+ viable tech options · locking a public API contract · any deviation from §2 · ClickHouse schema changes · adding a new queue.

**STATE.md schema block (always include):**
```
### Schema
Drizzle: {last migration filename}
ClickHouse: {last DDL applied or "no change"}
```

---

## 10. Definition of Done

A feature is **done** only when all are true:
1. Merged to `main`, deployed to production service.
2. `bun test` covers the contract (input → output), not implementation details.
3. If the code path is new: a real request flows through and lands in ClickHouse.
4. `STATE.md` updated (shipped + next task).
5. ADR written if a non-obvious decision was made.
6. Krishna ran the path once manually with real credentials.

**Explicitly not done:** "works locally" · "tests pass" · "TypeScript compiles". Necessary, not sufficient.

---

## 11. Per-Feature Checklist

Before writing code for any feature:
- [ ] 2-sentence design note written in STATE.md (what / why / what changes)
- [ ] Stack confirmed — no new deps without OK
- [ ] Schema migration written first if data shape changes
- [ ] Layering respected: route → service → repo → DB

After writing code:
- [ ] `bun test` runs green
- [ ] Gateway smoke tested with real curl if hot path touched
- [ ] No accidental `console.log` with sensitive data
- [ ] Committed with conventional message
- [ ] STATE.md updated

---

## 12. Session Bootstrap

Claude Code reads CLAUDE.md automatically on session start.

**Also read STATE.md and confirm:**
```
Day N / 30
Active slice: [what]
Last migration: [filename]
Known bugs: [list or "none"]
→ Ready. Waiting for task.
```

If STATE.md doesn't exist yet: create it with the schema above before proceeding.

---

## 13. Security Rules

**Virtual key vault:**
- Real provider keys stored AES-256-GCM encrypted in `virtual_keys.encrypted_key`.
- `ENCRYPTION_KEY` = 32-byte hex env var. Never hardcode. Never log.
- Decrypt only inside `keyVault.decrypt()` called from `virtualKeyResolver`. Nowhere else.
- Decrypted key lives in Hono context (`c.get('ctx').realApiKey`). Never serialized, never passed to functions that might log.
- Virtual key format: `tl-vk-{nanoid(24)}`. Gateway prefix-checks `tl-vk-` as fast-fail guard.

**Never stored, never logged:** real provider keys · virtual key values in logs · full request/response bodies · plaintext passwords · raw Stripe webhook body after validation.

**Custom request headers (gateway reads these, inject into logs):**
```
X-TL-Feature    cost attribution tag          e.g. "chat-summarizer"
X-TL-User-Id    end-customer ID               per-customer margin tracking
X-TL-Env        environment                   "production" | "staging" | "dev"
X-Request-Id    generated at rateLimiter       propagated through all downstream logs
```

**SSRF guard (requestValidator):** if body contains `base_url` override → validate against provider allowlist. Reject localhost, private IPs, unknown domains. Return 400.

---

## 14. Data Schema Snapshot

**Postgres tables (Drizzle `schema.ts`):**
```
workspaces         id · name · plan · budget_cap · slack_webhook_url · stripe_customer_id · created_at
users              id · email · name · created_at
workspace_members  workspace_id · user_id · role (admin|member) · created_at
virtual_keys       id · workspace_id · name · provider · encrypted_key · budget_cap · is_active · created_at
model_pricing      id · provider · model_pattern · input_price_per_m · output_price_per_m · updated_at
alert_configs      id · workspace_id · channel (slack|email) · threshold_pct · cooldown_min · is_active
```

**ClickHouse table: `request_logs`**
```
workspace_id    String
virtual_key_id  String
provider        LowCardinality(String)
model           LowCardinality(String)
env_tag         LowCardinality(String)
feature_tag     String DEFAULT ''
user_id_tag     String DEFAULT ''
tokens_in       UInt32
tokens_out      UInt32
cost_usd        Float64
latency_ms      UInt32
status_code     UInt16
request_id      String
created_at      DateTime64(3, 'UTC')
```

**BullMQ queues and job shapes:**
```
ingestion     { virtualKeyId, workspaceId, provider, model, envTag, featureTag,
                userIdTag, tokensIn, tokensOut, latencyMs, statusCode, requestId, createdAt }
alert         { type: 'budget'|'anomaly'|'dead_key', workspaceId, virtualKeyId,
                keyName, spend, cap?, percentage?, baseline?, multiplier? }
anomaly       { virtualKeyId, workspaceId }            ← scheduled every 5min
forecast      { workspaceId }                          ← scheduled every 1h
export        { workspaceId, userId, filters, format: 'csv'|'pdf' }
```

---

## 15. Environment Variables

```
# All services (validated in packages/shared/src/env.ts via Zod)
DATABASE_URL            Neon Postgres
CLICKHOUSE_URL          ClickHouse Cloud HTTPS endpoint
CLICKHOUSE_USER         default
CLICKHOUSE_PASSWORD
DRAGONFLY_URL           redis://... (DragonflyDB, Redis protocol)
ENCRYPTION_KEY          32-byte hex — AES-256-GCM for virtual keys

# Gateway
PORT                    8787
GATEWAY_ENV             production | staging | dev

# Web
BETTER_AUTH_URL         https://app.tokenlens.io
BETTER_AUTH_SECRET      32-char random
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_GATEWAY_URL shown in onboarding SDK snippet

# Worker
WORKER_CONCURRENCY      10 (default)

# Integrations
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
```

Missing required var on startup → `process.exit(1)` with `Missing env: {VAR_NAME}`. No silent fallbacks.

---

## 16. Pricing Model Reference

Model pricing matched by regex against `model_pricing.model_pattern`. First match wins.

```
Provider    Pattern              Input $/M    Output $/M
OpenAI      gpt-4o(?!-mini).*    2.50         10.00
OpenAI      gpt-4o-mini.*        0.15          0.60
OpenAI      gpt-4-turbo.*        10.00         30.00
OpenAI      gpt-3.5-turbo.*      0.50          1.50
Anthropic   claude-3-5-sonnet.*  3.00         15.00
Anthropic   claude-3-5-haiku.*   0.80          4.00
Anthropic   claude-3-opus.*     15.00         75.00
Anthropic   claude-3-haiku.*     0.25          1.25
Google      gemini-1.5-pro.*     1.25          5.00
Google      gemini-1.5-flash.*   0.075         0.30
```

Seeded via `drizzle-kit seed` on first deploy. Updated via admin endpoint (not manually in DB).

---

*CLAUDE.md = constitution. STATE.md = current reality. JOURNAL.md = history. Code = truth.
Conflicts are resolved by updating the doc to match the code — never the reverse.*
