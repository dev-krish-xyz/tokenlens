import type { MiddlewareHandler } from 'hono'
import { z } from 'zod'
import { ValidationError } from '@tokenlens/shared'
import { env } from '../env.ts'

const SSRF_PATTERNS = [
  '169.254.169.254',
  '10.',
  '192.168.',
  'localhost',
  '127.0.0.1',
] as const

const bodySchema = z.object({
  model: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      }),
    )
    .min(1),
  stream: z.boolean().optional(),
  max_tokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

interface TLConfig {
  featureTag?: string
  userIdTag?: string
  envTag?: string
}

export const requestValidator: MiddlewareHandler = async (c, next) => {
  const rawBody = await c.req.text()

  // SSRF guard — must run before Zod parse so user-controlled strings are blocked early
  if (rawBody.includes('base_url')) {
    throw new ValidationError('Custom base_url not allowed')
  }
  for (const pattern of SSRF_PATTERNS) {
    if (rawBody.includes(pattern)) {
      throw new ValidationError('SSRF: internal addresses not allowed')
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    throw new ValidationError('Invalid JSON body')
  }

  const result = bodySchema.safeParse(parsed)
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid request body')
  }

  const body = result.data
  c.set('body', body)
  c.set('isStreaming', body.stream === true)

  // Attribution headers
  const headerFeature = c.req.header('X-TL-Feature')
  const headerUserId = c.req.header('X-TL-User-Id')
  const headerEnv = c.req.header('X-TL-Env')

  // x-tokenlens-config is lower priority — only used when the direct header is absent
  let config: TLConfig = {}
  const configHeader = c.req.header('x-tokenlens-config')
  if (configHeader !== undefined) {
    try {
      config = JSON.parse(configHeader) as TLConfig
    } catch {
      throw new ValidationError('Invalid x-tokenlens-config JSON')
    }
  }

  c.set('featureTag', headerFeature ?? config.featureTag ?? '')
  c.set('userIdTag', headerUserId ?? config.userIdTag ?? '')
  c.set('envTag', headerEnv ?? config.envTag ?? env.GATEWAY_ENV)

  await next()
}
