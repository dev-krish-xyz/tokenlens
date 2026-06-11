import { describe, test, expect, mock, beforeEach } from 'bun:test'

mock.module('next/headers', () => ({ headers: mock(() => new Map()) }))
mock.module('next/navigation', () => ({
  redirect: mock((url: string) => { throw new Error(`redirect:${url}`) }),
}))

const mockWorkspaceUpdate = mock(async () => {})
const mockFindByStripeSubId = mock(async (): Promise<{ id: string } | null> => null)

mock.module('@tokenlens/shared/workspaceRepo', () => ({
  update: mockWorkspaceUpdate,
  findByStripeSubId: mockFindByStripeSubId,
  findById: mock(async () => null),
  findByUserId: mock(async () => null),
  getBudgetCap: mock(async () => null),
  invalidateBudgetCapCache: mock(async () => {}),
  listAllWorkspaceIds: mock(async () => []),
}))

const mockInvalidatePlanCache = mock(async () => {})

mock.module('@tokenlens/shared/services/planService', () => ({
  getPlanTier: mock(async () => 'free'),
  invalidatePlanCache: mockInvalidatePlanCache,
  isProOrAbove: mock(() => false),
}))

mock.module('../../../../env.ts', () => ({
  env: {
    BETTER_AUTH_URL: 'http://localhost:3000',
    STRIPE_SECRET_KEY: 'sk_test_fake',
    STRIPE_WEBHOOK_SECRET: 'whsec_fake',
    STRIPE_PRICE_ID_PRO: 'price_fake',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    RESEND_API_KEY: 'resend_fake',
  },
}))

// Stripe mock: constructEvent validates sig header
let _constructEventShouldThrow = false
let _constructEventResult: unknown = null

const mockConstructEvent = mock((_body: string, _sig: string, _secret: string) => {
  if (_constructEventShouldThrow) throw new Error('Invalid signature')
  return _constructEventResult
})

mock.module('stripe', () => {
  const StripeClass = class {
    webhooks = { constructEvent: mockConstructEvent }
    customers = { create: mock(async () => ({ id: 'cus_new' })) }
    checkout = {
      sessions: {
        create: mock(async () => ({ url: 'https://checkout.stripe.com/test' })),
      },
    }
  }
  return { default: StripeClass }
})

const { POST } = await import('./route.ts')

function makeRequest(body: unknown, sig = 'valid-sig'): Request {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': sig, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  _constructEventShouldThrow = false
  _constructEventResult = null
  mockWorkspaceUpdate.mockClear()
  mockInvalidatePlanCache.mockClear()
  mockFindByStripeSubId.mockClear()
  mockConstructEvent.mockClear()
})

describe('webhook', () => {
  test('invalid stripe signature → 400', async () => {
    _constructEventShouldThrow = true
    const res = await POST(makeRequest({ type: 'test' }))
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('Invalid signature')
  })

  test('checkout.session.completed → sets planTier to pro + invalidates cache', async () => {
    _constructEventResult = {
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          subscription: 'sub_123',
          metadata: { workspaceId: 'ws-abc' },
        },
      },
    }
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)
    expect(mockWorkspaceUpdate.mock.calls).toHaveLength(1)
    const updateArgs = mockWorkspaceUpdate.mock.calls[0] as unknown as [string, Record<string, unknown>]
    expect(updateArgs[0]).toBe('ws-abc')
    expect(updateArgs[1].plan_tier).toBe('pro')
    expect(updateArgs[1].stripe_subscription_id).toBe('sub_123')
    expect(mockInvalidatePlanCache.mock.calls).toHaveLength(1)
  })

  test('customer.subscription.deleted → sets planTier to free + invalidates cache', async () => {
    _constructEventResult = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_456',
          status: 'canceled',
          metadata: { workspaceId: 'ws-def' },
        },
      },
    }
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(200)
    expect(mockWorkspaceUpdate.mock.calls).toHaveLength(1)
    const updateArgs = mockWorkspaceUpdate.mock.calls[0] as unknown as [string, Record<string, unknown>]
    expect(updateArgs[0]).toBe('ws-def')
    expect(updateArgs[1].plan_tier).toBe('free')
    expect(mockInvalidatePlanCache.mock.calls).toHaveLength(1)
  })
})
