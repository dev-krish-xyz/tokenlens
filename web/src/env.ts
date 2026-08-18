// Only file in this package that reads process.env
import { sharedEnv } from '@tokenlens/shared';
import { z } from 'zod';

/** Prefer explicit env; on Vercel fall back to the deployment URL. */
function resolveAppUrl(): string {
  if (process.env['NEXT_PUBLIC_APP_URL']) return process.env['NEXT_PUBLIC_APP_URL'];
  if (process.env['BETTER_AUTH_URL']) return process.env['BETTER_AUTH_URL'];
  if (process.env['VERCEL_URL']) return `https://${process.env['VERCEL_URL']}`;
  return 'http://localhost:3000';
}

const appUrl = resolveAppUrl();

const result = z
  .object({
    BETTER_AUTH_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    NEXT_PUBLIC_GATEWAY_URL: z.string().url(),
    // Optional — Google OAuth works only when both are provided
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    // Optional — Stripe/Resend not required for auth
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_ID_PRO: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  })
  .safeParse({
    ...process.env,
    BETTER_AUTH_URL: process.env['BETTER_AUTH_URL'] ?? appUrl,
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'] ?? appUrl,
  });

if (!result.success) {
  const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error(`[web] Missing or invalid environment variables: ${missing}`);
  process.exit(1);
}

export const env = { ...sharedEnv, ...result.data };
export type Env = typeof env;
