import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import {
  AuthError,
  AppError,
  RateLimitError,
  ValidationError,
  ProviderError,
  BudgetExceededError,
} from '../../../packages/shared/src/errors'
import { calculateCost } from '../../../packages/shared/src/services/costCalculator'
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
  BudgetExceededError,
  calculateCost,
}))

mock.module('@tokenlens/shared/queues/definitions', () => ({
  ingestionQueue: { add: mockIngestionAdd },
}))

// Registry mock must keep all 3 providers — other test files assert on
// Object.keys(providerRegistry) and mock.module leaks across files.
const passthroughProvider = (name: string, chatEndpoint: string) => ({
  name,
  chatEndpoint,
  transformRequest: (body: unknown) => body,
  transformResponse: (body: unknown) => body,
  buildHeaders: (_key: string) => ({ Authorization: 'Bearer test' }),
})

mock.module('../providers/index.ts', () => ({
  providerRegistry: {
    openai: passthroughProvider('openai', '/v1/chat/completions'),
    anthropic: passthroughProvider('anthropic', '/v1/messages'),
    gemini: passthroughProvider('gemini', '/generateContent'),
  },
}))

const { streamHandler } = await import('./stream.ts')

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

function sseBody(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

function makeFetchMock(chunks: string[], ok = true, status = 200) {
  return mock(async () => ({
    ok,
    status,
    body: sseBody(chunks),
    text: async () => '',
  }))
}

function makeApp() {
  const app = new Hono<{ Variables: Record<string, unknown> }>()
  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ code: err.code, error: err.message }, err.status as 400 | 401 | 429 | 502)
    }
    return c.json({ code: 'INTERNAL_ERROR' }, 500)
  })
  app.post('/v1/chat/completions', async (c) => {
    c.set('ctx', MOCK_CTX)
    c.set('body', MOCK_BODY)
    c.set('isStreaming', true)
    c.set('requestId', 'req-test-123')
    c.set('envTag', 'test')
    c.set('featureTag', 'chat')
    c.set('userIdTag', 'user-456')
    return streamHandler(c as never)
  })
  return app
}

beforeEach(() => {
  mockIngestionAdd.mockClear()
})

describe('streamHandler', () => {
  test('normal SSE chunks pass through verbatim', async () => {
    globalThis.fetch = makeFetchMock([
      'data: {"choices":[{"delta":{"content":"hel"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
      'data: [DONE]\n\n',
    ]) as unknown as typeof fetch

    const res = await makeApp().request('/v1/chat/completions', { method: 'POST' })
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(text).toContain('"hel"')
    expect(text).toContain('data: [DONE]')
  })

  test('mid-stream upstream error event replaced with generic event, detail never reaches client', async () => {
    globalThis.fetch = makeFetchMock([
      'data: {"choices":[{"delta":{"content":"hi"}}]}\n\n',
      'data: {"error":{"message":"You exceeded your current quota for org-PLATFORM-SECRET","type":"insufficient_quota"}}\n\n',
    ]) as unknown as typeof fetch

    const res = await makeApp().request('/v1/chat/completions', { method: 'POST' })
    const text = await res.text()

    expect(text).not.toContain('org-PLATFORM-SECRET')
    expect(text).not.toContain('insufficient_quota')
    expect(text).toContain('"Upstream provider error"')
  })

  test('assistant content containing the word "error" is NOT filtered', async () => {
    globalThis.fetch = makeFetchMock([
      'data: {"choices":[{"delta":{"content":"an \\"error\\" occurred in your code"}}]}\n\n',
      'data: [DONE]\n\n',
    ]) as unknown as typeof fetch

    const res = await makeApp().request('/v1/chat/completions', { method: 'POST' })
    const text = await res.text()

    expect(text).toContain('occurred in your code')
    expect(text).not.toContain('Upstream provider error')
  })

  test('usage chunk captured into ingestion job with tokens', async () => {
    globalThis.fetch = makeFetchMock([
      'data: {"choices":[{"delta":{"content":"hi"}}]}\n\n',
      'data: {"usage":{"prompt_tokens":42,"completion_tokens":7}}\n\n',
      'data: [DONE]\n\n',
    ]) as unknown as typeof fetch

    const res = await makeApp().request('/v1/chat/completions', { method: 'POST' })
    await res.text()
    await new Promise((r) => setTimeout(r, 0))

    expect(mockIngestionAdd.mock.calls).toHaveLength(1)
    const job = mockIngestionAdd.mock.calls[0]?.[1] as { tokensIn: number; tokensOut: number }
    expect(job.tokensIn).toBe(42)
    expect(job.tokensOut).toBe(7)
  })

  test('upstream non-OK before streaming — generic 502, no upstream status in body', async () => {
    globalThis.fetch = makeFetchMock([], false, 401) as unknown as typeof fetch

    const res = await makeApp().request('/v1/chat/completions', { method: 'POST' })

    expect(res.status).toBe(502)
    const body = (await res.json()) as { code: string; error: string }
    expect(body.code).toBe('PROVIDER_ERROR')
    expect(body.error).not.toContain('401')
  })

  test('upstream 429 passes through as 429', async () => {
    globalThis.fetch = makeFetchMock([], false, 429) as unknown as typeof fetch

    const res = await makeApp().request('/v1/chat/completions', { method: 'POST' })
    expect(res.status).toBe(429)
  })
})
