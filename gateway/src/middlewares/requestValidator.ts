import type { MiddlewareHandler } from 'hono'
import { z } from 'zod'
import { ValidationError } from '@tokenlens/shared'
import { env } from '../env.ts'

// URL-overriding fields are rejected structurally rather than by scanning the
// raw body for IP substrings — substring scans false-positive on message
// content ("call me at 10.30") while missing encoded addresses. No
// user-controlled value is ever used as a URL: the schema is strict and the
// provider URL is built from DB-sourced config only.
const FORBIDDEN_KEYS = ['base_url', 'api_base', 'baseURL', 'azure_endpoint'] as const

const bodySchema = z
  .object({
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
  .strict()

interface TLConfig {
  featureTag?: string
  userIdTag?: string
  envTag?: string
}

export const requestValidator: MiddlewareHandler = async (c, next) => {
  const rawBody = await c.req.text()

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    throw new ValidationError('Invalid JSON body')
  }

  if (parsed !== null && typeof parsed === 'object') {
    for (const key of FORBIDDEN_KEYS) {
      if (key in parsed) {
        throw new ValidationError(`Custom ${key} not allowed`)
      }
    }
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
