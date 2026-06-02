import type { MiddlewareHandler } from 'hono';
import { dragonflyClient, RateLimitError } from '@tokenlens/shared';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export const rateLimiter: MiddlewareHandler = async (c, next) => {
  const ip =
    c.req.header('CF-Connecting-IP') ??
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown';

  const key = `rl:${ip}`;
  const now = Date.now();

  const pipeline = dragonflyClient.pipeline();
  pipeline.zremrangebyscore(key, 0, now - WINDOW_MS);
  pipeline.zadd(key, 'NX', now, String(now));
  pipeline.expire(key, 120);
  pipeline.zcard(key);
  const results = await pipeline.exec();

  const countResult = results?.[3];
  const count = countResult?.[1];

  if (typeof count === 'number' && count > MAX_REQUESTS) {
    throw new RateLimitError('Rate limit exceeded');
  }

  await next();
};
