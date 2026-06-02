import type { MiddlewareHandler } from 'hono';
import { nanoid } from 'nanoid';

export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
  const id = nanoid(21);
  c.set('requestId', id);
  c.header('X-Request-Id', id);
  await next();
};
