import type { MiddlewareHandler } from 'hono'
import { dragonflyClient, AuthError } from '@tokenlens/shared'
import type { WorkspaceContext } from '@tokenlens/shared'
import { decrypt } from '@tokenlens/shared/keyVault'
import { findById } from '@tokenlens/shared/virtualKeyRepo'

export const virtualKeyResolver: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) throw new AuthError('Missing Authorization header')

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token.startsWith('tl-vk-')) throw new AuthError('Invalid virtual key format')

  const virtualKeyId = token
  const cacheKey = `vk:${virtualKeyId}`

  const cached = await dragonflyClient.get(cacheKey)
  if (cached) {
    const ctx = JSON.parse(cached) as WorkspaceContext
    c.set('ctx', ctx)
    await next()
    return
  }

  const key = await findById(virtualKeyId)
  if (!key) throw new AuthError('Virtual key not found or inactive')

  const realApiKey = decrypt(key.encrypted_key)

  const ctx: WorkspaceContext = {
    workspaceId: key.workspace_id,
    virtualKeyId: key.id,
    realApiKey,
    provider: key.provider,
    budgetCap: key.budget_cap ? Number(key.budget_cap) : null,
  }

  // realApiKey is included in the cached context intentionally —
  // DragonflyDB is internal infrastructure, not externally exposed.
  await dragonflyClient.setex(cacheKey, 300, JSON.stringify(ctx))

  c.set('ctx', ctx)
  await next()
}
