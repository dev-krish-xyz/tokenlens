// Only file in this package that reads process.env
import { sharedEnv } from '@tokenlens/shared';
import { z } from 'zod';

const result = z
  .object({
    WORKER_CONCURRENCY: z.coerce.number().default(10),
    RESEND_API_KEY: z.string().optional(),
  })
  .safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error(`[worker] Missing or invalid environment variables: ${missing}`);
  process.exit(1);
}

export const env = { ...sharedEnv, ...result.data };
export type Env = typeof env;
