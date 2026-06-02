import type { MiddlewareHandler } from 'hono';

export const requestValidator: MiddlewareHandler = async (c, next) => {
  await next();
};
