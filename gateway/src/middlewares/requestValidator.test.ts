import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import { ValidationError, AppError, AuthError, RateLimitError, ProviderError } from '../../../packages/shared/src/errors'

// Re-mock @tokenlens/shared comprehensively so it includes ValidationError even when
// the rateLimiter test file ran first (its partial mock omits ValidationError).
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
  ValidationError,
  AppError,
  AuthError,
  RateLimitError,
  ProviderError,
}))

// Mock gateway env.ts so GATEWAY_ENV is predictable in tests
mock.module('../env.ts', () => ({
  env: { PORT: 8787, GATEWAY_ENV: 'dev' as const },
}))

const { requestValidator } = await import('./requestValidator.ts')

type Res = Record<string, unknown>

function makeApp() {
  const app = new Hono<{ Variables: Record<string, unknown> }>()
  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ code: err.code, error: err.message }, err.status as 400 | 401 | 429 | 500)
    }
    return c.json({ code: 'INTERNAL_ERROR' }, 500)
  })
  app.use('/v1/*', requestValidator)
  app.post('/v1/chat/completions', (c) =>
    c.json({
      ok: true,
      body: c.get('body'),
      isStreaming: c.get('isStreaming'),
      userIdTag: c.get('userIdTag'),
      envTag: c.get('envTag'),
      featureTag: c.get('featureTag'),
    }),
  )
  return app
}

const app = makeApp()

const validBody = { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] }

function post(body: unknown, headers?: Record<string, string>) {
  return app.request('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

describe('body validation', () => {
  test('valid body → next() called, body populated', async () => {
    const res = await post(validBody)
    expect(res.status).toBe(200)
    const json = (await res.json()) as Res
    expect(json['ok']).toBe(true)
    expect((json['body'] as Res)?.['model']).toBe('gpt-4o')
  })

  test('missing messages → ValidationError', async () => {
    const res = await post({ model: 'gpt-4o' })
    expect(res.status).toBe(400)
    const json = (await res.json()) as Res
    expect(json['code']).toBe('VALIDATION_ERROR')
  })

  test('empty messages array → ValidationError', async () => {
    const res = await post({ model: 'gpt-4o', messages: [] })
    expect(res.status).toBe(400)
    const json = (await res.json()) as Res
    expect(json['code']).toBe('VALIDATION_ERROR')
  })

  test('invalid role value → ValidationError', async () => {
    const res = await post({ model: 'gpt-4o', messages: [{ role: 'tool', content: 'hi' }] })
    expect(res.status).toBe(400)
    const json = (await res.json()) as Res
    expect(json['code']).toBe('VALIDATION_ERROR')
  })

  test('temperature: 3 → ValidationError', async () => {
    const res = await post({ ...validBody, temperature: 3 })
    expect(res.status).toBe(400)
    const json = (await res.json()) as Res
    expect(json['code']).toBe('VALIDATION_ERROR')
  })
})

describe('SSRF guard', () => {
  test('base_url field → ValidationError', async () => {
    const res = await post({ ...validBody, base_url: 'http://example.com' })
    expect(res.status).toBe(400)
    const json = (await res.json()) as Res
    expect(json['code']).toBe('VALIDATION_ERROR')
  })

  test('169.254.169.254 in body → ValidationError', async () => {
    const res = await post({ ...validBody, url: 'http://169.254.169.254/latest' })
    expect(res.status).toBe(400)
    const json = (await res.json()) as Res
    expect(json['code']).toBe('VALIDATION_ERROR')
  })

  test('localhost in body → ValidationError', async () => {
    const res = await post({ ...validBody, url: 'http://localhost:8080' })
    expect(res.status).toBe(400)
    const json = (await res.json()) as Res
    expect(json['code']).toBe('VALIDATION_ERROR')
  })

  test('192.168. in body → ValidationError', async () => {
    const res = await post({ ...validBody, url: 'http://192.168.1.1' })
    expect(res.status).toBe(400)
    const json = (await res.json()) as Res
    expect(json['code']).toBe('VALIDATION_ERROR')
  })
})

describe('header extraction', () => {
  test('X-TL-User-Id → userIdTag', async () => {
    const res = await post(validBody, { 'X-TL-User-Id': 'cust-42' })
    const json = (await res.json()) as Res
    expect(json['userIdTag']).toBe('cust-42')
  })

  test('X-TL-Env: staging → envTag', async () => {
    const res = await post(validBody, { 'X-TL-Env': 'staging' })
    const json = (await res.json()) as Res
    expect(json['envTag']).toBe('staging')
  })

  test('X-TL-Env absent → envTag defaults to GATEWAY_ENV', async () => {
    const res = await post(validBody)
    const json = (await res.json()) as Res
    expect(json['envTag']).toBe('dev')
  })

  test('x-tokenlens-config userIdTag used when header absent', async () => {
    const res = await post(validBody, {
      'x-tokenlens-config': JSON.stringify({ userIdTag: 'u1' }),
    })
    const json = (await res.json()) as Res
    expect(json['userIdTag']).toBe('u1')
  })

  test('x-tokenlens-config invalid JSON → ValidationError', async () => {
    const res = await post(validBody, { 'x-tokenlens-config': '{bad json' })
    expect(res.status).toBe(400)
    const json = (await res.json()) as Res
    expect(json['code']).toBe('VALIDATION_ERROR')
  })

  test('X-TL-User-Id takes precedence over x-tokenlens-config', async () => {
    const res = await post(validBody, {
      'X-TL-User-Id': 'direct-user',
      'x-tokenlens-config': JSON.stringify({ userIdTag: 'config-user' }),
    })
    const json = (await res.json()) as Res
    expect(json['userIdTag']).toBe('direct-user')
  })
})

describe('isStreaming', () => {
  test('stream: true → isStreaming true', async () => {
    const res = await post({ ...validBody, stream: true })
    const json = (await res.json()) as Res
    expect(json['isStreaming']).toBe(true)
  })

  test('stream absent → isStreaming false', async () => {
    const res = await post(validBody)
    const json = (await res.json()) as Res
    expect(json['isStreaming']).toBe(false)
  })
})
