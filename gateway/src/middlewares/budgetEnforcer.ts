import type { MiddlewareHandler } from 'hono'
import { BudgetExceededError, calculateCost } from '@tokenlens/shared'
import { getBudgetCap } from '@tokenlens/shared/workspaceRepo'
import { reserveSpend, releaseSpend } from '@tokenlens/shared/services/budgetService'
import { findByPattern } from '@tokenlens/shared/pricingRepo'

// Rough chars-per-token heuristic for the input estimate; the worker replaces
// the estimate with metered usage after the response, so precision only
// affects how early a near-cap key gets blocked.
const CHARS_PER_TOKEN = 4
const DEFAULT_MAX_TOKENS_ESTIMATE = 1024

export const budgetEnforcer: MiddlewareHandler = async (c, next) => {
  const ctx = c.get('ctx')
  const wsCap = await getBudgetCap(ctx.workspaceId)

  if (ctx.budgetCap === null && wsCap === null) {
    await next()
    return
  }

  const body = c.get('body')
  const pricing = await findByPattern(ctx.provider, body.model)
  const estTokensIn = Math.ceil(
    body.messages.reduce((sum: number, m: { content: string }) => sum + m.content.length, 0) /
      CHARS_PER_TOKEN,
  )
  const estTokensOut = body.max_tokens ?? DEFAULT_MAX_TOKENS_ESTIMATE
  const estCostUsd = calculateCost(estTokensIn, estTokensOut, pricing)

  // Atomic reserve-then-check: INCRBYFLOAT returns the post-increment total,
  // so concurrent requests cannot all pass a stale read of the counter.
  const { keySpend, wsSpend } = await reserveSpend(ctx.virtualKeyId, ctx.workspaceId, estCostUsd)

  const keyOver = ctx.budgetCap !== null && keySpend > ctx.budgetCap
  const wsOver = wsCap !== null && wsSpend > wsCap

  if (keyOver || wsOver) {
    await releaseSpend(ctx.virtualKeyId, ctx.workspaceId, estCostUsd)
    if (keyOver) {
      throw new BudgetExceededError(
        `Virtual key budget exceeded. Spent: $${(keySpend - estCostUsd).toFixed(4)}, Cap: $${(ctx.budgetCap ?? 0).toFixed(4)}`,
      )
    }
    throw new BudgetExceededError(`Workspace budget exceeded. Cap: $${(wsCap ?? 0).toFixed(4)}`)
  }

  c.set('reservedCostUsd', estCostUsd)

  await next()

  // Hono routes downstream errors to onError and resolves next() normally,
  // exposing the failure via c.error. Provider call failed → no ingestion job
  // will be enqueued → no worker adjustment, so refund the reservation here.
  if (c.error) {
    await releaseSpend(ctx.virtualKeyId, ctx.workspaceId, estCostUsd)
  }
}
