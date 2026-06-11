import { protectedMemberProcedure, router } from '../trpc.ts'
import * as virtualKeyRepo from '@tokenlens/shared/virtualKeyRepo'
import { getCurrentSpend } from '@tokenlens/shared/services/budgetService'
import { getBudgetCap } from '@tokenlens/shared/workspaceRepo'

export const budgetRouter = router({
  getKeyBudgetStatus: protectedMemberProcedure.query(async ({ ctx }) => {
    const keys = await virtualKeyRepo.findByWorkspace(ctx.workspaceId)
    const keysWithCap = keys.filter((k) => k.budget_cap !== null)
    const results = await Promise.all(
      keysWithCap.map(async (key) => {
        const cap = parseFloat(key.budget_cap!)
        const { keySpend } = await getCurrentSpend(key.id, ctx.workspaceId)
        const remaining = cap - keySpend
        return {
          keyId: key.id,
          keyName: key.name,
          provider: key.provider,
          spend: keySpend,
          cap,
          remaining,
          percentage: Math.min((keySpend / cap) * 100, 100),
        }
      })
    )
    return results
  }),

  getWorkspaceBudgetStatus: protectedMemberProcedure.query(async ({ ctx }) => {
    const cap = await getBudgetCap(ctx.workspaceId)
    if (!cap) return null
    const { wsSpend } = await getCurrentSpend('_', ctx.workspaceId)
    return {
      cap,
      spend: wsSpend,
      remaining: cap - wsSpend,
      percentage: Math.min((wsSpend / cap) * 100, 100),
    }
  }),
})
