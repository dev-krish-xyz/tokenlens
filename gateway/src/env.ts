// Only file in this package that reads process.env
import { sharedEnv } from '@tokenlens/shared';
import { z } from 'zod';

const result = z
  .object({
    PORT: z.coerce.number().default(8787),
    GATEWAY_ENV: z.enum(['production', 'staging', 'dev']).default('dev'),
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  })
  .safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error(`[gateway] Missing or invalid environment variables: ${missing}`);
  process.exit(1);
}

export const env = { ...sharedEnv, ...result.data };
export type Env = typeof env;
