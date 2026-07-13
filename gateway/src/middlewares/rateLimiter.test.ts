import { describe, test, expect, mock } from 'bun:test';
import { Hono } from 'hono';
// Import error classes directly from source — avoids triggering shared/src/env.ts
import { AppError, RateLimitError, ValidationError, AuthError, ProviderError, BudgetExceededError } from '../../../packages/shared/src/errors';
import { calculateCost } from '../../../packages/shared/src/services/costCalculator';

type AppVariables = { requestId: string | undefined };

// Build a mock pipeline whose exec returns a configurable ZCARD result
function makePipeline(count: number | null) {
  return {
    zremrangebyscore: mock((_key: string, _min: number, _max: number) => pipeline),
    zadd: mock((_key: string, _score: number, _member: string) => pipeline),
    expire: mock(() => pipeline),
    zcard: mock(() => pipeline),
    exec: mock(async () =>
      count === null
        ? []
        : [
            [null, 1],
            [null, 1],
            [null, 1],
            [null, count],
          ],
    ),
  };
}
let pipeline = makePipeline(1);

// Mock @tokenlens/shared BEFORE any dynamic import that transitively uses it
mock.module('@tokenlens/shared', () => ({
  dragonflyClient: {
    pipeline: () => pipeline,
    get: mock(async () => null),
    setex: mock(async () => 'OK' as const),
  },
  calculateCost,
  RateLimitError,
  AppError,
  ValidationError,
  AuthError,
  ProviderError,
  BudgetExceededError,
}));

// Mock gateway env so TRUST_PROXY_HEADERS is predictable in tests
mock.module('../env.ts', () => ({
  env: { PORT: 8787, GATEWAY_ENV: 'dev' as const, TRUST_PROXY_HEADERS: false },
}));

const { rateLimiter } = await import('./rateLimiter.ts');
const { requestIdMiddleware } = await import('./requestId.ts');

function makeApp(count: number | null) {
  pipeline = makePipeline(count);

  const app = new Hono<{ Variables: AppVariables }>();
  app.onError((err, c) => {
    const requestId = c.get('requestId') ?? 'unknown';
    if (err instanceof AppError) {
      return c.json(
        { error: err.message, code: err.code, requestId },
        err.status as 400 | 401 | 429 | 502,
      );
    }
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR', requestId }, 500);
  });
  app.use('*', requestIdMiddleware);
  app.use('*', rateLimiter);
  app.get('/health', (c) => c.json({ ok: true }));
  return app;
}

describe('rateLimiter', () => {
  test('60 requests in window — passes', async () => {
    const res = await makeApp(60).request('/health');
    expect(res.status).toBe(200);
  });

  test('61st request — 429 RATE_LIMITED', async () => {
    const res = await makeApp(61).request('/health');
    expect(res.status).toBe(429);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('RATE_LIMITED');
  });

  test('X-Forwarded-For ignored when TRUST_PROXY_HEADERS=false — spoofed IP does not change bucket', async () => {
    const app = makeApp(1);
    await app.request('/health', { headers: { 'X-Forwarded-For': '1.2.3.4' } });
    const key = pipeline.zremrangebyscore.mock.calls[0]?.[0];
    // no real socket in app.request(), so untrusted-headers path falls back to 'unknown'
    expect(key).toBe('rl:unknown');
  });

  test('CF-Connecting-IP ignored when TRUST_PROXY_HEADERS=false', async () => {
    const app = makeApp(1);
    await app.request('/health', { headers: { 'CF-Connecting-IP': '9.9.9.9' } });
    const key = pipeline.zremrangebyscore.mock.calls[0]?.[0];
    expect(key).toBe('rl:unknown');
  });

  test('zset member is unique per request (timestamp:requestId)', async () => {
    const app = makeApp(1);
    await app.request('/health');
    const member = pipeline.zadd.mock.calls[0]?.[2];
    expect(typeof member).toBe('string');
    // "<ms>:<21-char nanoid>"
    expect(member).toMatch(/^\d+:.{21}$/);
  });

  test('pipeline failure — fails open (request allowed) instead of crashing', async () => {
    const res = await makeApp(null).request('/health');
    expect(res.status).toBe(200);
  });
});

describe('requestIdMiddleware', () => {
  test('sets X-Request-Id header (21 chars)', async () => {
    const res = await makeApp(1).request('/health');
    const id = res.headers.get('X-Request-Id');
    expect(id).toBeTruthy();
    expect(id).toHaveLength(21);
  });
});

describe('onError handler', () => {
  test('AppError 401 → status 401 with {error, code, requestId}', async () => {
    const app = new Hono<{ Variables: AppVariables }>();
    app.use('*', requestIdMiddleware);
    app.onError((err, c) => {
      const requestId = c.get('requestId') ?? 'unknown';
      if (err instanceof AppError) {
        return c.json(
          { error: err.message, code: err.code, requestId },
          err.status as 400 | 401 | 429 | 502,
        );
      }
      return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR', requestId }, 500);
    });
    app.get('/test', () => {
      throw new AppError('Unauthorized', 'UNAUTHORIZED', 401);
    });

    const res = await app.request('/test');
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string; code: string; requestId: string };
    expect(body.code).toBe('UNAUTHORIZED');
    expect(body.error).toBe('Unauthorized');
    expect(body.requestId).toHaveLength(21);
  });
});
