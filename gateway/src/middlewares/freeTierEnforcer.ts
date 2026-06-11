import type { MiddlewareHandler } from 'hono'
import { getPlanTier, isProOrAbove } from '@tokenlens/shared/services/planService'
import { getMonthlyRequestCount } from '@tokenlens/shared/services/usageService'
import { env } from '../env.ts'

export const MAX_FREE_REQUESTS_PER_MONTH = 50_000

export const freeTierEnforcer: MiddlewareHandler = async (c, next) => {
  const ctx = c.get('ctx')
  const tier = await getPlanTier(ctx.workspaceId)

  if (isProOrAbove(tier)) {
    await next()
    return
  }

  const count = await getMonthlyRequestCount(ctx.workspaceId)

  if (count >= MAX_FREE_REQUESTS_PER_MONTH) {
    return c.json(
      {
        error: 'Free tier limit reached',
        message: `Your workspace has used ${count.toLocaleString()} requests this month. Upgrade to Pro for unlimited requests.`,
        upgradeUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
        code: 'FREE_TIER_EXCEEDED',
      },
      402,
    )
  }

  await next()
}
