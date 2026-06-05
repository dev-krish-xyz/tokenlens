import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { AuthError, AppError, RateLimitError, ValidationError, ProviderError } from '../../../packages/shared/src/errors'

let _cacheData: Record<string, string> = {}
let _dbRow: Record<string, unknown> | null = null

const mockDragonflyGet = mock(async (key: string) => _cacheData[key] ?? null)
const mockDragonflySetex = mock(async (_key: string, _ttl: number, _val: string) => 'OK' as const)
const mockFindById = mock(async (_id: string) => _dbRow)
const mockDecrypt = mock((_ct: string) => 'sk-real-api-key-value')

// Comprehensive mock — covers rateLimiter and requestValidator consumers too
mock.module('@tokenlens/shared', () => ({
  dragonflyClient: {
    get: mockDragonflyGet,
    setex: mockDragonflySetex,
    pipeline: () => ({ zremrangebyscore: mock(() => {}), zadd: mock(() => {}), expire: mock(() => {}), zcard: mock(() => {}), exec: mock(async () => []) }),
  },
  AuthError,
  AppError,
  RateLimitError,
  ValidationError,
  ProviderError,
}))

mock.module('@tokenlens/shared/keyVault', () => ({ decrypt: mockDecrypt }))
mock.module('@tokenlens/shared/virtualKeyRepo', () => ({ findById: mockFindById }))

const { virtualKeyResolver } = await import('./virtualKeyResolver.ts')

const BASE_KEY = {
  id: 'tl-vk-aabbccdd1122334455667788',
  workspace_id: 'ws-abc',
  name: 'Test Key',
  provider: 'openai',
  encrypted_key: 'enc-data-here',
  budget_cap: '50.00',
  is_active: true,
  created_at: new Date(),
}

const BEARER = 'Bearer tl-vk-aabbccdd1122334455667788'

function makeApp() {
  const app = new Hono<{ Variables: Record<string, unknown> }>()
  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ code: err.code, error: err.message }, err.status as 400 | 401 | 429)
    }
    return c.json({ code: 'INTERNAL_ERROR' }, 500)
  })
  app.use('*', virtualKeyResolver)
  app.post('/test', (c) => c.json({ ctx: c.get('ctx') }))
  return app
}

beforeEach(() => {
  _cacheData = {}
  _dbRow = null
  mockDragonflyGet.mockClear()
  mockDragonflySetex.mockClear()
  mockFindById.mockClear()
  mockDecrypt.mockClear()
})

describe('cache hit path', () => {
  test('next() called and findById NOT called on cache hit', async () => {
    const cached = {
      workspaceId: 'ws-cached',
      virtualKeyId: 'tl-vk-aabbccdd1122334455667788',
      realApiKey: 'sk-cached',
      provider: 'openai',
      budgetCap: null,
    }
    _cacheData['vk:tl-vk-aabbccdd1122334455667788'] = JSON.stringify(cached)

    const res = await makeApp().request('/test', {
      method: 'POST',
      headers: { Authorization: BEARER },
    })
    expect(res.status).toBe(200)
    expect(mockFindById.mock.calls).toHaveLength(0)
    const body = (await res.json()) as { ctx: { workspaceId: string } }
    expect(body.ctx.workspaceId).toBe('ws-cached')
  })
})

describe('cache miss path', () => {
  test('findById called and setex called with TTL 300', async () => {
    _dbRow = BASE_KEY

    const res = await makeApp().request('/test', {
      method: 'POST',
      headers: { Authorization: BEARER },
    })
    expect(res.status).toBe(200)
    expect(mockFindById.mock.calls).toHaveLength(1)
    expect(mockDragonflySetex.mock.calls).toHaveLength(1)
    const call = mockDragonflySetex.mock.calls[0] as [string, number, string]
    expect(call[1]).toBe(300)
  })

  test('ctx.provider matches key.provider', async () => {
    _dbRow = { ...BASE_KEY, provider: 'anthropic' }

    const res = await makeApp().request('/test', {
      method: 'POST',
      headers: { Authorization: BEARER },
    })
    const body = (await res.json()) as { ctx: { provider: string } }
    expect(body.ctx.provider).toBe('anthropic')
  })
})

describe('auth failures', () => {
  test('missing Authorization header → 401', async () => {
    const res = await makeApp().request('/test', { method: 'POST' })
    expect(res.status).toBe(401)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('UNAUTHORIZED')
  })

  test('Bearer not starting with tl-vk- → 401, no IO calls', async () => {
    const res = await makeApp().request('/test', {
      method: 'POST',
      headers: { Authorization: 'Bearer sk-some-random-key' },
    })
    expect(res.status).toBe(401)
    expect(mockDragonflyGet.mock.calls).toHaveLength(0)
    expect(mockFindById.mock.calls).toHaveLength(0)
  })

  test('valid format but findById returns null → 401', async () => {
    _dbRow = null

    const res = await makeApp().request('/test', {
      method: 'POST',
      headers: { Authorization: BEARER },
    })
    expect(res.status).toBe(401)
  })
})

describe('security', () => {
  test('ctx.realApiKey is populated from decrypt()', async () => {
    _dbRow = BASE_KEY

    const res = await makeApp().request('/test', {
      method: 'POST',
      headers: { Authorization: BEARER },
    })
    const body = (await res.json()) as { ctx: { realApiKey: string } }
    expect(body.ctx.realApiKey).toBe('sk-real-api-key-value')
  })

  test('realApiKey does not appear in any console.log or console.error call', async () => {
    _dbRow = BASE_KEY
    const consoleSpy = mock((..._args: unknown[]) => {})
    const origLog = console.log
    const origError = console.error
    console.log = consoleSpy as typeof console.log
    console.error = consoleSpy as typeof console.error

    try {
      await makeApp().request('/test', {
        method: 'POST',
        headers: { Authorization: BEARER },
      })
    } finally {
      console.log = origLog
      console.error = origError
    }

    for (const call of consoleSpy.mock.calls) {
      const args = (call as unknown[]).map(String).join(' ')
      expect(args).not.toContain('sk-real-api-key-value')
    }
  })
})
