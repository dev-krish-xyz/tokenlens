import type { MiddlewareHandler } from 'hono'
import { dragonflyClient, AuthError } from '@tokenlens/shared'
import type { WorkspaceContext } from '@tokenlens/shared'
import { decrypt } from '@tokenlens/shared/keyVault'
import { findById } from '@tokenlens/shared/virtualKeyRepo'

// Cached entries keep the provider key encrypted at rest in DragonflyDB and
// decrypt it per request — a cache dump never yields plaintext provider keys.
type CachedKeyContext = Omit<WorkspaceContext, 'realApiKey'> & { encryptedKey: string }

export const virtualKeyResolver: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) throw new AuthError('Missing Authorization header')

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token.startsWith('tl-vk-')) throw new AuthError('Invalid virtual key format')

  const virtualKeyId = token
  const cacheKey = `vk:${virtualKeyId}`

  const cached = await dragonflyClient.get(cacheKey)
  if (cached) {
    const parsed = JSON.parse(cached) as Partial<CachedKeyContext>
    // Entries without encryptedKey (pre-hardening shape) fall through to the
    // DB path below and get rewritten in the new shape.
    if (typeof parsed.encryptedKey === 'string') {
      const { encryptedKey, ...rest } = parsed as CachedKeyContext
      c.set('ctx', { ...rest, realApiKey: decrypt(encryptedKey) })
      await next()
      return
    }
  }

  const key = await findById(virtualKeyId)
  if (!key) throw new AuthError('Virtual key not found or inactive')

  const cacheable: CachedKeyContext = {
    workspaceId: key.workspace_id,
    virtualKeyId: key.id,
    encryptedKey: key.encrypted_key,
    provider: key.provider,
    budgetCap: key.budget_cap ? Number(key.budget_cap) : null,
  }
  await dragonflyClient.setex(cacheKey, 300, JSON.stringify(cacheable))

  const { encryptedKey, ...rest } = cacheable
  c.set('ctx', { ...rest, realApiKey: decrypt(encryptedKey) })
  await next()
}
