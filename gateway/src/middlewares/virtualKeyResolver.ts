import type { MiddlewareHandler } from 'hono';

export const virtualKeyResolver: MiddlewareHandler = async (c, next) => {
  await next();
};
