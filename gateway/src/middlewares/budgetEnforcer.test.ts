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
import { calculateCost } from '../../../packages/shared/src/services/costCalculator'
import type { WorkspaceContext } from '../../../packages/shared/src/types'
import type { ModelPricing } from '../../../packages/shared/src/db/schema'

const mockGetBudgetCap = mock(async (_wsId: string): Promise<number | null> => null)
const mockReserveSpend = mock(
  async (
    _keyId: string,
    _wsId: string,
    _costUsd: number
  ): Promise<{ keySpend: number; wsSpend: number }> => ({ keySpend: 0, wsSpend: 0 })
)
const mockReleaseSpend = mock(async (_keyId: string, _wsId: string, _costUsd: number) => {})
const mockFindByPattern = mock(
  async (_provider: string, _model: string): Promise<ModelPricing | null> => null
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
  calculateCost,
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
  reserveSpend: mockReserveSpend,
  releaseSpend: mockReleaseSpend,
}))

mock.module('@tokenlens/shared/pricingRepo', () => ({
  findByPattern: mockFindByPattern,
}))

const { budgetEnforcer } = await import('./budgetEnforcer.ts')

const BASE_CTX: WorkspaceContext = {
  workspaceId: 'ws-test',
  virtualKeyId: 'vk-test',
  realApiKey: 'sk-real',
  provider: 'openai',
  budgetCap: null,
}

const BASE_BODY = {
  model: 'gpt-4o',
  messages: [{ role: 'user' as const, content: 'hi' }],
}

// input: $10/M, output: $30/M — with 1-char message (1 est token in) and the
// 1024-token default output estimate: est ≈ 0.00001 + 0.03072 ≈ $0.03073
const PRICING: ModelPricing = {
  id: 'price-1',
  provider: 'openai',
  model_pattern: 'gpt-4o',
  input_price_per_m: '10',
  output_price_per_m: '30',
  updated_at: new Date(),
} as ModelPricing

function makeApp(ctx: Partial<WorkspaceContext> = {}, handlerThrows = false) {
  const app = new Hono<{ Variables: Record<string, unknown> }>()
  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ code: err.code, error: err.message }, err.status as 400 | 401 | 429)
    }
    return c.json({ code: 'INTERNAL_ERROR' }, 500)
  })
  app.use('*', (c, next) => {
    c.set('ctx', { ...BASE_CTX, ...ctx })
    c.set('body', BASE_BODY)
    return next()
  })
  app.use('*', budgetEnforcer)
  app.get('/test', (c) => {
    if (handlerThrows) throw new ProviderError('Provider returned 500', 502)
    return c.json({ ok: true, reservedCostUsd: c.get('reservedCostUsd') })
  })
  return app
}

beforeEach(() => {
  mockGetBudgetCap.mockClear()
  mockReserveSpend.mockClear()
  mockReleaseSpend.mockClear()
  mockFindByPattern.mockClear()
  mockGetBudgetCap.mockImplementation(async () => null)
  mockReserveSpend.mockImplementation(async () => ({ keySpend: 0, wsSpend: 0 }))
  mockFindByPattern.mockImplementation(async () => PRICING)
})

describe('fast path — no caps', () => {
  test('ctx.budgetCap=null, wsCap=null → next() called, reserveSpend NOT called', async () => {
    const res = await makeApp({ budgetCap: null }).request('/test')
    expect(res.status).toBe(200)
    expect(mockReserveSpend.mock.calls).toHaveLength(0)
    expect(mockFindByPattern.mock.calls).toHaveLength(0)
  })
})

describe('atomic reserve-then-check', () => {
  test('reserveSpend called with estimated cost > 0 when pricing known', async () => {
    await makeApp({ budgetCap: 10 }).request('/test')
    expect(mockReserveSpend.mock.calls).toHaveLength(1)
    const est = mockReserveSpend.mock.calls[0]?.[2] as number
    expect(est).toBeGreaterThan(0)
    expect(est).toBeCloseTo(0.03073, 4)
  })

  test('post-reserve total under cap → 200, reservation kept (no release), reservedCostUsd set', async () => {
    mockReserveSpend.mockImplementation(async () => ({ keySpend: 5, wsSpend: 0 }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    expect(res.status).toBe(200)
    expect(mockReleaseSpend.mock.calls).toHaveLength(0)
    const body = (await res.json()) as { reservedCostUsd: number }
    expect(body.reservedCostUsd).toBeGreaterThan(0)
  })

  test('post-reserve total over key cap → 429 and reservation refunded', async () => {
    mockReserveSpend.mockImplementation(async () => ({ keySpend: 10.5, wsSpend: 0 }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    expect(res.status).toBe(429)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('BUDGET_EXCEEDED')
    expect(mockReleaseSpend.mock.calls).toHaveLength(1)
    // refund amount must equal the reserved amount
    expect(mockReleaseSpend.mock.calls[0]?.[2]).toBe(mockReserveSpend.mock.calls[0]?.[2])
  })

  test('unknown pricing → estimate 0, spend at exactly cap still allowed through', async () => {
    mockFindByPattern.mockImplementation(async () => null)
    mockReserveSpend.mockImplementation(async () => ({ keySpend: 10, wsSpend: 0 }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    expect(res.status).toBe(200)
  })

  test('spend just over cap → 429', async () => {
    mockFindByPattern.mockImplementation(async () => null)
    mockReserveSpend.mockImplementation(async () => ({ keySpend: 10.0001, wsSpend: 0 }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    expect(res.status).toBe(429)
  })
})

describe('workspace cap enforcement', () => {
  test('ws total over wsCap → 429 even with key budget remaining', async () => {
    mockGetBudgetCap.mockImplementation(async () => 50)
    mockReserveSpend.mockImplementation(async () => ({ keySpend: 5, wsSpend: 51 }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    expect(res.status).toBe(429)
    const body = (await res.json()) as { code: string; error: string }
    expect(body.code).toBe('BUDGET_EXCEEDED')
    expect(body.error).toContain('Workspace')
    expect(mockReleaseSpend.mock.calls).toHaveLength(1)
  })

  test('only wsCap set (key cap null) → enforced against ws total', async () => {
    mockGetBudgetCap.mockImplementation(async () => 50)
    mockReserveSpend.mockImplementation(async () => ({ keySpend: 60, wsSpend: 49 }))
    const res = await makeApp({ budgetCap: null }).request('/test')
    // keySpend high but no key cap → only wsCap matters, and ws is under
    expect(res.status).toBe(200)
  })
})

describe('refund on downstream failure', () => {
  test('provider handler throws → reservation released, error propagates', async () => {
    mockReserveSpend.mockImplementation(async () => ({ keySpend: 1, wsSpend: 0 }))
    const res = await makeApp({ budgetCap: 10 }, true).request('/test')
    expect(res.status).toBe(502)
    expect(mockReleaseSpend.mock.calls).toHaveLength(1)
    expect(mockReleaseSpend.mock.calls[0]?.[2]).toBe(mockReserveSpend.mock.calls[0]?.[2])
  })
})

describe('error shape', () => {
  test('BudgetExceededError has code=BUDGET_EXCEEDED and status=429', () => {
    const err = new BudgetExceededError('test exceeded')
    expect(err.code).toBe('BUDGET_EXCEEDED')
    expect(err.status).toBe(429)
  })

  test('error message contains Cap: with dollar amount', async () => {
    mockReserveSpend.mockImplementation(async () => ({ keySpend: 11, wsSpend: 0 }))
    const res = await makeApp({ budgetCap: 10 }).request('/test')
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('Cap:')
    expect(body.error).toContain('$')
  })
})
