import { z } from 'zod'
import { protectedWorkspaceProcedure, router } from '../trpc.ts'
import * as clickhouseQueries from '@tokenlens/shared/clickhouse/queries'

const daysInput = z.object({ days: z.number().int().min(1).max(90).default(7) })

export const costRouter = router({
  getDailySpend: protectedWorkspaceProcedure
    .input(daysInput)
    .query(({ ctx, input }) => clickhouseQueries.getDailySpend(ctx.workspaceId, input.days)),

  getTopModels: protectedWorkspaceProcedure
    .input(daysInput)
    .query(({ ctx, input }) => clickhouseQueries.getTopModels(ctx.workspaceId, input.days)),

  getSummaryStats: protectedWorkspaceProcedure
    .input(daysInput)
    .query(({ ctx, input }) => clickhouseQueries.getSummaryStats(ctx.workspaceId, input.days)),

  getRequestLogs: protectedWorkspaceProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(90).default(7),
        model: z.string().optional(),
        provider: z.enum(['openai', 'anthropic', 'gemini']).optional(),
        userId: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const [rows, total] = await Promise.all([
        clickhouseQueries.getRequestLogs(ctx.workspaceId, input),
        clickhouseQueries.getRequestLogCount(ctx.workspaceId, input),
      ])
      return { rows, total }
    }),

  getPerCustomerCost: protectedWorkspaceProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
    .query(({ ctx, input }) => clickhouseQueries.getPerCustomerCost(ctx.workspaceId, input.days)),
})
