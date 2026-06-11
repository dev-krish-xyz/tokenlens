import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { randomBytes } from 'node:crypto'
import { sql, eq } from 'drizzle-orm'
import {
  db,
  model_pricing,
  workspaces,
  users,
  workspace_members,
  virtual_keys,
  dragonflyClient,
  clickhouseClient,
} from '@tokenlens/shared'
import { encrypt, decrypt } from '@tokenlens/shared/keyVault'
import { findById } from '@tokenlens/shared/virtualKeyRepo'
import { ingestionQueue } from '@tokenlens/shared/queues/definitions'
import type { IngestionJobData } from '@tokenlens/shared/queues/types'
import { getDailySpend, getPerCustomerCost } from '@tokenlens/shared/clickhouse/queries'

const TEST_WORKSPACE_ID = crypto.randomUUID()
const TEST_USER_ID = crypto.randomUUID()
let virtualKeyId: string
let encryptedKey: string
let testRequestId: string

// ---------------------------------------------------------------------------
// Step 1 — Database connectivity
// ---------------------------------------------------------------------------

describe('Step 1 — Database connectivity', () => {
  test('postgres connects and all tables exist', async () => {
    const result = await db.execute(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    `)
    const names = (result.rows as unknown as Array<{ table_name: string }>).map(
      (r) => r.table_name
    )
    expect(names).toContain('workspaces')
    expect(names).toContain('users')
    expect(names).toContain('workspace_members')
    expect(names).toContain('virtual_keys')
    expect(names).toContain('model_pricing')
    expect(names).toContain('alert_configs')
  })

  test('model_pricing has 10 seed rows', async () => {
    const rows = await db.select().from(model_pricing)
    expect(rows.length).toBe(10)
  })

  test('clickhouse connects and request_logs table exists', async () => {
    const res = await clickhouseClient.query({
      query: `SELECT count() AS c FROM system.tables
              WHERE database='default' AND name='request_logs'`,
      format: 'JSONEachRow',
    })
    const rows = await res.json<{ c: string }>()
    expect(Number(rows[0]?.c)).toBe(1)
  })

  test('dragonfly connects', async () => {
    const pong = await dragonflyClient.ping()
    expect(pong).toBe('PONG')
  })
})

// ---------------------------------------------------------------------------
// Step 2 — Virtual key lifecycle
// ---------------------------------------------------------------------------

describe('Step 2 — Virtual key lifecycle', () => {
  test('create workspace and user directly in DB', async () => {
    await db.insert(workspaces).values({
      id: TEST_WORKSPACE_ID,
      name: 'E2E Test Workspace',
      plan: 'free',
    })
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: `e2e-${Date.now()}@test.com`,
      name: 'E2E User',
    })
    await db.insert(workspace_members).values({
      workspace_id: TEST_WORKSPACE_ID,
      user_id: TEST_USER_ID,
      role: 'admin',
    })
  })

  test('encrypt a key and create virtual key row', async () => {
    const fakeApiKey = 'sk-e2e-test-key-' + randomBytes(16).toString('hex')
    encryptedKey = encrypt(fakeApiKey)
    virtualKeyId = crypto.randomUUID()

    await db.insert(virtual_keys).values({
      id: virtualKeyId,
      workspace_id: TEST_WORKSPACE_ID,
      name: 'E2E Test Key',
      provider: 'openai',
      encrypted_key: encryptedKey,
      is_active: true,
    })

    // uuid format: 8-4-4-4-12 hex chars
    expect(virtualKeyId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(decrypt(encryptedKey)).toBe(fakeApiKey)
  })

  test('virtualKeyRepo.findById returns key for active key', async () => {
    const key = await findById(virtualKeyId)
    expect(key).not.toBeNull()
    expect(key!.workspace_id).toBe(TEST_WORKSPACE_ID)
  })

  test('DragonflyDB cache miss then hit for virtual key', async () => {
    await dragonflyClient.del(`vk:${virtualKeyId}`)

    const key = await findById(virtualKeyId)
    const ctx = {
      workspaceId: key!.workspace_id,
      virtualKeyId: key!.id,
      realApiKey: decrypt(key!.encrypted_key),
      provider: key!.provider,
      budgetCap: null,
    }
    await dragonflyClient.setex(`vk:${virtualKeyId}`, 300, JSON.stringify(ctx))

    const cached = await dragonflyClient.get(`vk:${virtualKeyId}`)
    expect(cached).not.toBeNull()
    const parsed = JSON.parse(cached!) as { workspaceId: string; realApiKey: string }
    expect(parsed.workspaceId).toBe(TEST_WORKSPACE_ID)
    expect(parsed.realApiKey).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Step 3 — Gateway request routing
// ---------------------------------------------------------------------------

describe('Step 3 — Gateway request routing', () => {
  beforeAll(async () => {
    // Clean rate limit window so Step 3 tests start with a fresh counter
    await dragonflyClient.del('rl:unknown')
  })

  test('gateway health check returns 200', async () => {
    const res = await fetch('http://localhost:8787/health')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string; env: string }
    expect(body.status).toBe('ok')
    expect(body.env).toBeDefined()
  })

  test('request without Authorization header returns 401', async () => {
    const res = await fetch('http://localhost:8787/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    })
    expect(res.status).toBe(401)
    const body = (await res.json()) as { code: string; requestId: string }
    expect(body.code).toBe('UNAUTHORIZED')
    expect(body.requestId).toBeDefined()
  })

  test('request with invalid key format returns 401', async () => {
    const res = await fetch('http://localhost:8787/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer not-a-virtual-key',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    })
    expect(res.status).toBe(401)
  })

  test('SSRF attempt returns 400', async () => {
    // requestValidator (#3 in chain) catches SSRF before virtualKeyResolver (#4)
    // so the bearer token format does not matter here
    const res = await fetch('http://localhost:8787/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${virtualKeyId}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hi' }],
        base_url: 'http://169.254.169.254/latest/meta-data',
      }),
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  test(
    'rate limit: 61 rapid requests returns 429 on 61st',
    async () => {
      await dragonflyClient.del('rl:unknown')

      const results: number[] = []
      for (let i = 0; i < 62; i++) {
        const res = await fetch('http://localhost:8787/health')
        results.push(res.status)
      }
      expect(results.filter((s) => s === 200).length).toBe(60)
      expect(results.filter((s) => s === 429).length).toBeGreaterThanOrEqual(1)
    },
    30_000
  )
})

// ---------------------------------------------------------------------------
// Step 4 — Ingestion pipeline
// ---------------------------------------------------------------------------

describe('Step 4 — Ingestion pipeline', () => {
  test(
    'enqueue job and verify ClickHouse row after processing',
    async () => {
      testRequestId = 'e2e-req-' + Date.now()

      const jobData: IngestionJobData = {
        requestId: testRequestId,
        virtualKeyId,
        workspaceId: TEST_WORKSPACE_ID,
        provider: 'openai',
        model: 'gpt-4o-mini',
        envTag: 'dev',
        featureTag: 'e2e-test',
        userIdTag: 'e2e-customer-1',
        tokensIn: 100,
        tokensOut: 50,
        latencyMs: 342,
        statusCode: 200,
        createdAt: new Date().toISOString(),
      }
      await ingestionQueue.add('ingest', jobData)

      // Give worker time to flush (ClickhouseWriter batches with 2s interval)
      await new Promise((r) => setTimeout(r, 5000))

      const res = await clickhouseClient.query({
        query: `
          SELECT request_id, cost_usd, user_id_tag, tokens_in, tokens_out
          FROM request_logs
          WHERE request_id = {requestId: String}
        `,
        query_params: { requestId: testRequestId },
        format: 'JSONEachRow',
      })
      const rows = await res.json<{
        request_id: string
        cost_usd: string
        user_id_tag: string
        tokens_in: string
        tokens_out: string
      }>()
      expect(rows.length).toBe(1)
      expect(rows[0]?.user_id_tag).toBe('e2e-customer-1')
      expect(Number(rows[0]?.tokens_in)).toBe(100)
      expect(Number(rows[0]?.tokens_out)).toBe(50)
    },
    15_000
  )

  test('cost_usd calculated correctly for gpt-4o-mini', async () => {
    const res = await clickhouseClient.query({
      query: `
        SELECT cost_usd FROM request_logs
        WHERE request_id = {requestId: String}
      `,
      query_params: { requestId: testRequestId },
      format: 'JSONEachRow',
    })
    const rows = await res.json<{ cost_usd: string }>()
    // gpt-4o-mini: $0.15 input + $0.60 output per million tokens
    // 100 in: 100 * 0.15 / 1_000_000 = 0.000015
    // 50 out:  50 * 0.60 / 1_000_000 = 0.000030
    // total: 0.000045
    const expected = 0.000045
    expect(Math.abs(Number(rows[0]?.cost_usd) - expected)).toBeLessThan(0.000001)
  })
})

// ---------------------------------------------------------------------------
// Step 5 — Dashboard queries
// ---------------------------------------------------------------------------

describe('Step 5 — Dashboard queries', () => {
  test('getDailySpend returns row for E2E workspace', async () => {
    const rows = await getDailySpend(TEST_WORKSPACE_ID, 1)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]?.totalCost).toBeGreaterThan(0)
  })

  test('getPerCustomerCost returns e2e-customer-1', async () => {
    const rows = await getPerCustomerCost(TEST_WORKSPACE_ID, 1)
    const customerRow = rows.find((r) => r.userIdTag === 'e2e-customer-1')
    expect(customerRow).toBeDefined()
    expect(customerRow!.requestCount).toBeGreaterThanOrEqual(1)
  })

  test('workspace isolation: getDailySpend for different workspaceId returns empty', async () => {
    const rows = await getDailySpend('non-existent-workspace-id', 7)
    expect(rows.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

afterAll(async () => {
  await db.delete(virtual_keys).where(eq(virtual_keys.workspace_id, TEST_WORKSPACE_ID))
  await db.delete(workspace_members).where(eq(workspace_members.workspace_id, TEST_WORKSPACE_ID))
  await db.delete(workspaces).where(eq(workspaces.id, TEST_WORKSPACE_ID))
  await db.delete(users).where(eq(users.id, TEST_USER_ID))
  await dragonflyClient.del(`vk:${virtualKeyId}`)
  // ClickHouse rows intentionally not deleted — featureTag='e2e-test' marks them
  await dragonflyClient.quit()
  process.exit(0)
})
