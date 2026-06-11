import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import {
  protectedWorkspaceProcedure,
  protectedAdminProcedure,
  protectedMemberProcedure,
  router,
} from '../trpc.ts'
import { findById, updateName, updateBudgetCap, invalidateBudgetCapCache } from '@tokenlens/shared/workspaceRepo'
import * as workspaceMemberRepo from '@tokenlens/shared/workspaceMemberRepo'

export const workspaceRouter = router({
  getSettings: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const workspace = await findById(ctx.workspaceId)
    if (!workspace) throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found' })
    const members = await workspaceMemberRepo.listMembers(ctx.workspaceId)
    return {
      id: workspace.id,
      name: workspace.name,
      plan: workspace.plan ?? 'free',
      budgetCap: workspace.budget_cap ? parseFloat(workspace.budget_cap) : null,
      createdAt: workspace.created_at,
      memberCount: members.length,
    }
  }),

  updateName: protectedAdminProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await updateName(ctx.workspaceId, input.name)
    }),

  updateBudgetCap: protectedAdminProcedure
    .input(z.object({ budgetCap: z.number().positive().nullable() }))
    .mutation(async ({ ctx, input }) => {
      await updateBudgetCap(ctx.workspaceId, input.budgetCap)
      await invalidateBudgetCapCache(ctx.workspaceId)
    }),

  listMembers: protectedMemberProcedure.query(({ ctx }) =>
    workspaceMemberRepo.listMembers(ctx.workspaceId)
  ),

  updateMemberRole: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        newRole: z.enum(['member', 'viewer']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await workspaceMemberRepo.updateRole(
        ctx.workspaceId,
        input.userId,
        input.newRole,
        ctx.session.user.id
      )
    }),

  removeMember: protectedAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await workspaceMemberRepo.removeMember(
        ctx.workspaceId,
        input.userId,
        ctx.session.user.id
      )
    }),
})
