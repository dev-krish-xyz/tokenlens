import { Hono } from 'hono';
import { AppError } from '@tokenlens/shared';
import { env } from './env.ts';
import { requestIdMiddleware } from './middlewares/requestId.ts';
import { rateLimiter } from './middlewares/rateLimiter.ts';
import { requestValidator } from './middlewares/requestValidator.ts';
import { virtualKeyResolver } from './middlewares/virtualKeyResolver.ts';
import { budgetEnforcer } from './middlewares/budgetEnforcer.ts';

type AppVariables = {
  requestId: string | undefined;
};

const app = new Hono<{ Variables: AppVariables }>();

app.onError((err, c) => {
  const requestId = c.get('requestId') ?? 'unknown';
  if (err instanceof AppError) {
    return c.json({ error: err.message, code: err.code, requestId }, err.status as 400 | 401 | 429 | 502);
  }
  console.error(err);
  return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR', requestId }, 500);
});

// Middleware — order is fixed per CLAUDE.md, do not reorder
app.use('*', requestIdMiddleware);
app.use('*', rateLimiter);
app.use('/v1/*', requestValidator);
app.use('/v1/*', virtualKeyResolver);
app.use('/v1/*', budgetEnforcer);

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: env.GATEWAY_ENV,
  });
});

app.post('/v1/chat/completions', (c) => {
  return c.json(
    {
      error: 'Not implemented',
      code: 'NOT_IMPLEMENTED',
      requestId: c.get('requestId') ?? 'unknown',
    },
    501,
  );
});

Bun.serve({ port: env.PORT, fetch: app.fetch });
