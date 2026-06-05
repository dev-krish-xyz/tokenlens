import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import {
  AuthError,
  AppError,
  RateLimitError,
  ValidationError,
  ProviderError,
} from '../../../packages/shared/src/errors'
import type { WorkspaceContext } from '../../../packages/shared/src/types'

const mockIngestionAdd = mock(async (_name: string, _data: unknown) => ({} as never))

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
  AuthError,
  AppError,
  RateLimitError,
  ValidationError,
  ProviderError,
}))

mock.module('@tokenlens/shared/queues/definitions', () => ({
  ingestionQueue: { add: mockIngestionAdd },
}))

const mockTransformRequest = mock((body: unknown) => body)
const mockTransformResponse = mock((body: unknown) => body)
const mockBuildHeaders = mock((_key: string) => ({ Authorization: 'Bearer test' }))

mock.module('../providers/index.ts', () => ({
  providerRegistry: {
    openai: {
      name: 'openai',
      chatEndpoint: '/v1/chat/completions',
      transformRequest: mockTransformRequest,
      transformResponse: mockTransformResponse,
      buildHeaders: mockBuildHeaders,
    },
    anthropic: {
      name: 'anthropic',
      chatEndpoint: '/v1/messages',
      transformRequest: mockTransformRequest,
      transformResponse: mockTransformResponse,
      buildHeaders: mockBuildHeaders,
    },
    gemini: {
      name: 'gemini',
      chatEndpoint: '/generateContent',
      transformRequest: mockTransformRequest,
      transformResponse: mockTransformResponse,
      buildHeaders: mockBuildHeaders,
    },
  },
}))

const { proxyHandler } = await import('./proxy.ts')

const MOCK_CTX: WorkspaceContext = {
  workspaceId: 'ws-123',
  virtualKeyId: 'tl-vk-abc',
  realApiKey: 'sk-real-key',
  provider: 'openai',
  budgetCap: null,
}

const MOCK_BODY = {
  model: 'gpt-4o-mini',
  messages: [{ role: 'user' as const, content: 'hello' }],
}

const MOCK_RESPONSE = {
  choices: [{ message: { role: 'assistant', content: 'hi' }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
}

function makeFetchMock(ok = true, status = 200, body = MOCK_RESPONSE) {
  return mock(async () => ({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }))
}

function makeApp(ctx: WorkspaceContext = MOCK_CTX) {
  const app = new Hono<{ Variables: Record<string, unknown> }>()
  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json(
        { code: err.code, error: err.message },
        err.status as 400 | 401 | 429 | 502,
      )
    }
    return c.json({ code: 'INTERNAL_ERROR' }, 500)
  })
  app.post('/v1/chat/completions', async (c) => {
    c.set('ctx', ctx)
    c.set('body', MOCK_BODY)
    c.set('isStreaming', false)
    c.set('requestId', 'req-test-123')
    c.set('envTag', 'test')
    c.set('featureTag', 'chat')
    c.set('userIdTag', 'user-456')
    return proxyHandler(c as never)
  })
  return app
}

beforeEach(() => {
  mockIngestionAdd.mockClear()
  mockTransformRequest.mockClear()
  mockTransformResponse.mockClear()
  mockBuildHeaders.mockClear()
})

describe('proxyHandler', () => {
  test('valid request — transformRequest called, fetch sent, normalized response returned', async () => {
    globalThis.fetch = makeFetchMock() as unknown as typeof fetch

    const res = await makeApp().request('/v1/chat/completions', { method: 'POST' })

    expect(res.status).toBe(200)
    expect(mockTransformRequest.mock.calls).toHaveLength(1)
    expect(mockBuildHeaders.mock.calls).toHaveLength(1)
    const body = (await res.json()) as typeof MOCK_RESPONSE
    expect(body.choices[0]?.message.content).toBe('hi')
  })

  test('provider fetch returns 500 — ProviderError thrown, ingestionQueue NOT called', async () => {
    globalThis.fetch = makeFetchMock(false, 500) as unknown as typeof fetch

    const res = await makeApp().request('/v1/chat/completions', { method: 'POST' })

    expect(res.status).toBe(500)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('PROVIDER_ERROR')
    expect(mockIngestionAdd.mock.calls).toHaveLength(0)
  })

  test('ingestionQueue.add is fire-and-forget — response returns before add resolves', async () => {
    globalThis.fetch = makeFetchMock() as unknown as typeof fetch

    let addResolved = false
    mockIngestionAdd.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 100))
      addResolved = true
      return {} as never
    })

    const res = await makeApp().request('/v1/chat/completions', { method: 'POST' })

    expect(res.status).toBe(200)
    expect(addResolved).toBe(false)
  })

  test('buildIngestionJob output passed to ingestionQueue has no realApiKey field', async () => {
    globalThis.fetch = makeFetchMock() as unknown as typeof fetch

    await makeApp().request('/v1/chat/completions', { method: 'POST' })

    expect(mockIngestionAdd.mock.calls).toHaveLength(1)
    const jobData = mockIngestionAdd.mock.calls[0]?.[1] as Record<string, unknown>
    expect('realApiKey' in jobData).toBe(false)
  })

  test('buildIngestionJob userIdTag matches context userIdTag', async () => {
    globalThis.fetch = makeFetchMock() as unknown as typeof fetch

    await makeApp().request('/v1/chat/completions', { method: 'POST' })

    const jobData = mockIngestionAdd.mock.calls[0]?.[1] as { userIdTag: string }
    expect(jobData.userIdTag).toBe('user-456')
  })

  test('unknown provider in ctx — ProviderError status 400', async () => {
    const app = new Hono<{ Variables: Record<string, unknown> }>()
    app.onError((err, c) => {
      if (err instanceof AppError) {
        return c.json({ code: err.code }, err.status as 400 | 401 | 429 | 502)
      }
      return c.json({ code: 'INTERNAL_ERROR' }, 500)
    })
    app.post('/v1/chat/completions', async (c) => {
      c.set('ctx', { ...MOCK_CTX, provider: 'unknown-provider' })
      c.set('body', MOCK_BODY)
      c.set('isStreaming', false)
      c.set('requestId', 'req-test')
      c.set('envTag', 'test')
      c.set('featureTag', 'f')
      c.set('userIdTag', 'u')
      return proxyHandler(c as never)
    })

    const res = await app.request('/v1/chat/completions', { method: 'POST' })

    expect(res.status).toBe(400)
    const body = (await res.json()) as { code: string }
    expect(body.code).toBe('PROVIDER_ERROR')
  })
})
