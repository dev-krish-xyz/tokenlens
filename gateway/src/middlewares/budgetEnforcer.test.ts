import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import {
  BudgetExceededError,
  AppError,
  AuthError,
  RateLimitError,
  ValidationError,
  ProviderError,
} from '../../../packages/shared/src/errors'
import type { WorkspaceContext } from '../../../packages/shared/src/types'

const mockGetBudgetCap = mock(async (_wsId: string): Promise<number | null> => null)
const mockGetRemainingBudget = mock(
  async (
    _keyId: string,
    _wsId: string,
    _keyCap: number | null,
    _wsCap: number | null
  ): Promise<{ keyRemaining: number | null; wsRemaining: number | null }> => ({
    keyRemaining: null,
    wsRemaining: null,
  })
)

mock.module('@tokenlens/shared', () => ({
  dragonflyClient: {
    get: mock(async () => null),
    setex: mock(async () => 'OK' as const),
    pipeline: () => ({
      zremrangebyscore: mock(() => {}),
      zadd: mock(() => {}),
      expire: mock(() => {}),
      zcard: mock(() => {}),
      exec: mock(async () => []),
    }),
  },
  BudgetExceededError,
  AppError,
  AuthError,
  RateLimitError,
  ValidationError,
  ProviderError,
}))

mock.module('@tokenlens/shared/workspaceRepo', () => ({
  getBudgetCap: mockGetBudgetCap,
}))

mock.module('@tokenlens/shared/services/budgetService', () => ({
  getRemainingBudget: mockGetRemainingBudget,
}))

const { budgetEnforcer } = await import('./budgetEnforcer.ts')

const BASE_CTX: WorkspaceContext = {
  workspaceId: 'ws-test',
  virtualKeyId: 'vk-test',
  realApiKey: 'sk-real',
  provider: 'openai',
  budgetCap: null,
}

function makeApp(ctx: Partial<WorkspaceContext> = {}) {
  const app = new Hono<{ Variables: Record<string, unknown> }>()
  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ code: err.code, error: err.message }, err.status as 400 | 401 | 429)
    }
    return c.json({ code: 'INTERNAL_ERROR' }, 500)
  })
  app.use('*', (c, next) => {
    c.set('ctx', { ...BASE_CTX, ...ctx })
    return next()
  })
  app.use('*', budgetEnforcer)
  app.get('/test', (c) => c.json({ ok: true }))
  return app
}

beforeEach(() => {
  mockGetBudgetCap.mockClear()
  mockGetRemainingBudget.mockClear()
  mockGetBudgetCap.mockImplementation(async () => null)
  mockGetRemainingBudget.mockImplementation(async () => ({ keyRemaining: null, wsRemaining: null }))
})

describe('fast path — no caps', () => {
  test('ctx.budgetCap=null, wsCap=null → next() called, getRemainingBudget NOT called', async () => {
    const res = await makeApp({ budgetCap: null }).request('/test')
    expect(res.status).toBe(200)
    expect(mockGetRemainingBudget.mock.calls).toHaveLength(0)
  })
})

describe('key cap enforcement', () => {
  test('keyRemaining=0.00 → 429 BudgetExceededError', async () => {
    mockGetBudgetCap.mockImplementation(async () => null)
    mockGetRemainingBudget.mockImplementation(async () => ({ keyRemaining: 0, wsRemaining: null }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    expect(res.status).toBe(429)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('BUDGET_EXCEEDED')
  })

  test('keyRemaining=-0.50 → 429 (already over budget)', async () => {
    mockGetBudgetCap.mockImplementation(async () => null)
    mockGetRemainingBudget.mockImplementation(async () => ({ keyRemaining: -0.5, wsRemaining: null }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    expect(res.status).toBe(429)
  })

  test('keyRemaining=0.001 → 200 (just under cap)', async () => {
    mockGetBudgetCap.mockImplementation(async () => null)
    mockGetRemainingBudget.mockImplementation(async () => ({ keyRemaining: 0.001, wsRemaining: null }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    expect(res.status).toBe(200)
  })

  test('keyRemaining=5.00 → 200', async () => {
    mockGetBudgetCap.mockImplementation(async () => null)
    mockGetRemainingBudget.mockImplementation(async () => ({ keyRemaining: 5, wsRemaining: null }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    expect(res.status).toBe(200)
  })
})

describe('workspace cap enforcement', () => {
  test('wsRemaining=0.00, keyRemaining=5.00 → 429 (ws cap triggers even with key budget remaining)', async () => {
    mockGetBudgetCap.mockImplementation(async () => 50)
    mockGetRemainingBudget.mockImplementation(async () => ({ keyRemaining: 5, wsRemaining: 0 }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    expect(res.status).toBe(429)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('BUDGET_EXCEEDED')
  })

  test('wsRemaining=-1.00 → 429', async () => {
    mockGetBudgetCap.mockImplementation(async () => 50)
    mockGetRemainingBudget.mockImplementation(async () => ({ keyRemaining: null, wsRemaining: -1 }))
    const res = await makeApp({ budgetCap: null }).request('/test')
    expect(res.status).toBe(429)
  })

  test('wsRemaining=null (no ws cap), keyRemaining=5.00 → 200', async () => {
    mockGetBudgetCap.mockImplementation(async () => null)
    mockGetRemainingBudget.mockImplementation(async () => ({ keyRemaining: 5, wsRemaining: null }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    expect(res.status).toBe(200)
  })
})

describe('error shape', () => {
  test('BudgetExceededError has code=BUDGET_EXCEEDED and status=429', () => {
    const err = new BudgetExceededError('test exceeded')
    expect(err.code).toBe('BUDGET_EXCEEDED')
    expect(err.status).toBe(429)
  })

  test('error message contains Cap: with dollar amount', async () => {
    mockGetBudgetCap.mockImplementation(async () => null)
    mockGetRemainingBudget.mockImplementation(async () => ({ keyRemaining: -0.5, wsRemaining: null }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('Cap:')
    expect(body.error).toContain('$')
  })
})

describe('fast path timing', () => {
  test('no caps → getRemainingBudget not called (spend read skipped)', async () => {
    const start = performance.now()
    const res = await makeApp({ budgetCap: null }).request('/test')
    const elapsed = performance.now() - start
    expect(res.status).toBe(200)
    expect(mockGetRemainingBudget.mock.calls).toHaveLength(0)
    expect(elapsed).toBeLessThan(5)
  })
})
