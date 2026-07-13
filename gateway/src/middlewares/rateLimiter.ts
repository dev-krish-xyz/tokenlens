import type { MiddlewareHandler } from 'hono';
import { getConnInfo } from 'hono/bun';
import { dragonflyClient, RateLimitError } from '@tokenlens/shared';
import { env } from '../env.ts';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export const rateLimiter: MiddlewareHandler = async (c, next) => {
  let ip: string | undefined;
  if (env.TRUST_PROXY_HEADERS) {
    // Rightmost X-Forwarded-For hop is the one appended by our own proxy;
    // the leftmost is client-controlled even behind a real proxy.
    ip =
      c.req.header('CF-Connecting-IP') ??
      c.req.header('X-Forwarded-For')?.split(',').at(-1)?.trim();
  }
  if (!ip) {
    try {
      ip = getConnInfo(c).remote.address ?? 'unknown';
    } catch {
      ip = 'unknown';
    }
  }

  const key = `rl:${ip}`;
  const now = Date.now();
  // requestId keeps members unique when two requests land in the same millisecond
  const member = `${now}:${c.get('requestId') ?? ''}`;

  const pipeline = dragonflyClient.pipeline();
  pipeline.zremrangebyscore(key, 0, now - WINDOW_MS);
  pipeline.zadd(key, now, member);
  pipeline.expire(key, 120);
  pipeline.zcard(key);
  const results = await pipeline.exec();

  const count = results?.[3]?.[1];

  if (typeof count !== 'number') {
    // Cache pipeline failed — fail open, but loudly, so an outage is visible.
    console.error('[rateLimiter] pipeline failed, allowing request unlimited');
    await next();
    return;
  }

  if (count > MAX_REQUESTS) {
    throw new RateLimitError('Rate limit exceeded');
  }

  await next();
};
