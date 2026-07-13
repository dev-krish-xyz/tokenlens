// Only file in this package that reads process.env
import { sharedEnv } from '@tokenlens/shared';
import { z } from 'zod';

const result = z
  .object({
    PORT: z.coerce.number().default(8787),
    GATEWAY_ENV: z.enum(['production', 'staging', 'dev']).default('dev'),
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
    // Only set to 'true' when the gateway sits behind a proxy that strips and
    // re-appends forwarding headers (e.g. Cloudflare). Otherwise clients can
    // spoof X-Forwarded-For to escape rate limiting.
    TRUST_PROXY_HEADERS: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
  })
  .safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error(`[gateway] Missing or invalid environment variables: ${missing}`);
  process.exit(1);
}

export const env = { ...sharedEnv, ...result.data };
export type Env = typeof env;
