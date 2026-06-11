import type { MiddlewareHandler } from 'hono'
import { BudgetExceededError } from '@tokenlens/shared'
import { getBudgetCap } from '@tokenlens/shared/workspaceRepo'
import { getRemainingBudget } from '@tokenlens/shared/services/budgetService'

export const budgetEnforcer: MiddlewareHandler = async (c, next) => {
  const ctx = c.get('ctx')
  const wsCap = await getBudgetCap(ctx.workspaceId)

  if (ctx.budgetCap === null && wsCap === null) {
    await next()
    return
  }

  const { keyRemaining, wsRemaining } = await getRemainingBudget(
    ctx.virtualKeyId,
    ctx.workspaceId,
    ctx.budgetCap,
    wsCap
  )

  if (keyRemaining !== null && keyRemaining <= 0) {
    throw new BudgetExceededError(
      `Virtual key budget exceeded. Spent: $${(-keyRemaining + (ctx.budgetCap ?? 0)).toFixed(4)}, Cap: $${(ctx.budgetCap ?? 0).toFixed(4)}`
    )
  }

  if (wsRemaining !== null && wsRemaining <= 0) {
    throw new BudgetExceededError(
      `Workspace budget exceeded. Cap: $${(wsCap ?? 0).toFixed(4)}`
    )
  }

  await next()
}
