// Only file in this package that reads process.env
import { sharedEnv } from '@tokenlens/shared';
import { z } from 'zod';

const result = z
  .object({
    BETTER_AUTH_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    NEXT_PUBLIC_GATEWAY_URL: z.string().url(),
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    RESEND_API_KEY: z.string(),
  })
  .safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error(`[web] Missing or invalid environment variables: ${missing}`);
  process.exit(1);
}

export const env = { ...sharedEnv, ...result.data };
export type Env = typeof env;
