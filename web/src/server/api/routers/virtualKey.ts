import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { protectedWorkspaceProcedure, protectedMemberProcedure, router } from '../trpc.ts'
import { encrypt } from '@tokenlens/shared/keyVault'
import { findByWorkspace, create, softDelete, updateBudget } from '@tokenlens/shared/virtualKeyRepo'

export const virtualKeyRouter = router({
  create: protectedMemberProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        provider: z.enum(['openai', 'anthropic', 'gemini']),
        realApiKey: z.string().min(1),
        budgetCap: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.realApiKey.startsWith('tl-vk-')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'That looks like a virtual key, not a real provider API key.',
        })
      }
      const encrypted_key = encrypt(input.realApiKey)
      const row = await create({
        workspace_id: ctx.workspaceId,
        name: input.name,
        provider: input.provider,
        encrypted_key,
        budget_cap: input.budgetCap !== undefined ? String(input.budgetCap) : null,
        is_active: true,
      })
      const { encrypted_key: _omit, ...safe } = row
      return safe
    }),

  list: protectedWorkspaceProcedure.query(({ ctx }) =>
    findByWorkspace(ctx.workspaceId)
  ),

  delete: protectedMemberProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await softDelete(input.id, ctx.workspaceId)
      return { success: true as const }
    }),

  updateBudget: protectedMemberProcedure
    .input(
      z.object({
        id: z.string(),
        budgetCap: z.number().positive().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await updateBudget(input.id, ctx.workspaceId, input.budgetCap)
      if (!result) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Key not found or not yours.' })
      }
      return result
    }),
})
