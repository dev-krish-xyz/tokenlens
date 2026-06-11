import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import {
  AppError,
  AuthError,
  RateLimitError,
  ValidationError,
  ProviderError,
  BudgetExceededError,
} from '../../../packages/shared/src/errors'
import type { WorkspaceContext } from '../../../packages/shared/src/types'

const mockGetPlanTier = mock(async (_wsId: string): Promise<'free' | 'pro' | 'enterprise'> => 'free')
const mockIsProOrAbove = mock((_tier: string): boolean => false)
const mockGetMonthlyRequestCount = mock(async (_wsId: string): Promise<number> => 0)

mock.module('@tokenlens/shared', () => ({
  AppError,
  AuthError,
  RateLimitError,
  ValidationError,
  ProviderError,
  BudgetExceededError,
}))

mock.module('@tokenlens/shared/services/planService', () => ({
  getPlanTier: mockGetPlanTier,
  isProOrAbove: mockIsProOrAbove,
}))

mock.module('@tokenlens/shared/services/usageService', () => ({
  getMonthlyRequestCount: mockGetMonthlyRequestCount,
}))

mock.module('../env.ts', () => ({
  env: {
    PORT: 8787,
    GATEWAY_ENV: 'dev',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    DATABASE_URL: 'postgres://test',
    CLICKHOUSE_URL: 'http://test',
    CLICKHOUSE_USER: 'default',
    CLICKHOUSE_PASSWORD: '',
    DRAGONFLY_URL: 'redis://test',
    ENCRYPTION_KEY: 'a'.repeat(64),
  },
}))

const { freeTierEnforcer, MAX_FREE_REQUESTS_PER_MONTH } = await import('./freeTierEnforcer.ts')

const BASE_CTX: WorkspaceContext = {
  workspaceId: 'ws-test',
  virtualKeyId: 'vk-test',
  realApiKey: 'sk-real',
  provider: 'openai',
  budgetCap: null,
}

function makeApp(ctxOverride: Partial<WorkspaceContext> = {}) {
  const app = new Hono<{ Variables: Record<string, unknown> }>()
  app.use('*', (c, next) => {
    c.set('ctx', { ...BASE_CTX, ...ctxOverride })
    return next()
  })
  app.use('*', freeTierEnforcer)
  app.get('/test', (c) => c.json({ ok: true }))
  return app
}

beforeEach(() => {
  mockGetPlanTier.mockClear()
  mockIsProOrAbove.mockClear()
  mockGetMonthlyRequestCount.mockClear()
  mockGetPlanTier.mockImplementation(async () => 'free')
  mockIsProOrAbove.mockImplementation(() => false)
  mockGetMonthlyRequestCount.mockImplementation(async () => 0)
})

describe('freeTierEnforcer', () => {
  test('pro workspace: calls next(), never calls usageService', async () => {
    mockGetPlanTier.mockImplementation(async () => 'pro')
    mockIsProOrAbove.mockImplementation(() => true)
    const res = await makeApp().request('/test')
    expect(res.status).toBe(200)
    expect(mockGetMonthlyRequestCount.mock.calls).toHaveLength(0)
  })

  test('free workspace under limit: calls next()', async () => {
    mockGetMonthlyRequestCount.mockImplementation(async () => 1000)
    const res = await makeApp().request('/test')
    expect(res.status).toBe(200)
  })

  test('free workspace at limit (count = MAX_FREE_REQUESTS_PER_MONTH): returns 402', async () => {
    mockGetMonthlyRequestCount.mockImplementation(async () => MAX_FREE_REQUESTS_PER_MONTH)
    const res = await makeApp().request('/test')
    expect(res.status).toBe(402)
    const body = (await res.json()) as { code: string; upgradeUrl: string }
    expect(body.code).toBe('FREE_TIER_EXCEEDED')
    expect(body.upgradeUrl).toContain('/dashboard/billing')
  })

  test('402 response includes code FREE_TIER_EXCEEDED', async () => {
    mockGetMonthlyRequestCount.mockImplementation(async () => MAX_FREE_REQUESTS_PER_MONTH + 1)
    const res = await makeApp().request('/test')
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('FREE_TIER_EXCEEDED')
  })
})
