import type { MiddlewareHandler } from 'hono';

export const budgetEnforcer: MiddlewareHandler = async (c, next) => {
  await next();
};
