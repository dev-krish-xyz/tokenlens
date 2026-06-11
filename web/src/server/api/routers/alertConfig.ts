import { z } from 'zod'
import { protectedMemberProcedure, protectedAdminProcedure, router } from '../trpc.ts'
import * as alertConfigRepo from '@tokenlens/shared/alertConfigRepo'

export const alertConfigRouter = router({
  listAlertConfigs: protectedMemberProcedure.query(({ ctx }) =>
    alertConfigRepo.listByWorkspace(ctx.workspaceId)
  ),

  createAlertConfig: protectedAdminProcedure
    .input(
      z.object({
        channel: z.string().min(1).max(500),
        thresholdPct: z.number().int().min(1).max(100).default(80),
        cooldownMin: z.number().int().min(5).max(1440).default(60),
      })
    )
    .mutation(({ ctx, input }) =>
      alertConfigRepo.create({
        workspaceId: ctx.workspaceId,
        channel: input.channel,
        thresholdPct: input.thresholdPct,
        cooldownMin: input.cooldownMin,
      })
    ),

  updateAlertConfig: protectedAdminProcedure
    .input(
      z.object({
        id: z.string(),
        channel: z.string().min(1).max(500).optional(),
        thresholdPct: z.number().int().min(1).max(100).optional(),
        cooldownMin: z.number().int().min(5).max(1440).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const data: Partial<{ channel: string; thresholdPct: number; cooldownMin: number; isActive: boolean }> = {}
      if (input.channel !== undefined) data.channel = input.channel
      if (input.thresholdPct !== undefined) data.thresholdPct = input.thresholdPct
      if (input.cooldownMin !== undefined) data.cooldownMin = input.cooldownMin
      if (input.isActive !== undefined) data.isActive = input.isActive
      return alertConfigRepo.update(input.id, ctx.workspaceId, data)
    }),

  deleteAlertConfig: protectedAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      alertConfigRepo.deleteConfig(input.id, ctx.workspaceId)
    ),
})
