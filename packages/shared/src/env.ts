// Only file in this package that reads process.env
import { z } from 'zod';

const result = z
  .object({
    DATABASE_URL: z.string().url(),
    CLICKHOUSE_URL: z.string().url(),
    CLICKHOUSE_USER: z.string().default('default'),
    CLICKHOUSE_PASSWORD: z.string().default(''),
    // redis:// local / rediss:// TLS (Upstash, Railway, managed Dragonfly)
    DRAGONFLY_URL: z
      .string()
      .regex(/^rediss?:\/\//, 'DRAGONFLY_URL must start with redis:// or rediss://'),
    ENCRYPTION_KEY: z.string().length(64),
  })
  .safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error(`[shared] Missing or invalid environment variables: ${missing}`);
  process.exit(1);
}

export const sharedEnv = result.data;
export type SharedEnv = typeof sharedEnv;
