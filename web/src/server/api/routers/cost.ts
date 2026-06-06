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
})
