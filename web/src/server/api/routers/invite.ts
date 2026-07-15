import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { protectedAdminProcedure, router } from '../trpc.ts'
import * as inviteRepo from '@tokenlens/shared/inviteRepo'
import { findById } from '@tokenlens/shared/workspaceRepo'
import * as workspaceMemberRepo from '@tokenlens/shared/workspaceMemberRepo'
import { sendInviteEmail } from '../../../lib/inviteEmail.ts'
import { env } from '../../../env.ts'

export const inviteRouter = router({
  sendInvite: protectedAdminProcedure
    .input(
      z.object({
        // Normalize case so the self-invite / duplicate / existing-member checks
        // can't be bypassed with a case variant of the same address.
        email: z.string().email().max(254).transform((e) => e.toLowerCase()),
        role: z.enum(['member', 'viewer']).default('member'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.email === ctx.session.user.email.toLowerCase()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot invite yourself' })
      }

      const pending = await inviteRepo.listPending(ctx.workspaceId)
      if (pending.some((i) => i.email.toLowerCase() === input.email)) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Invite already sent to this email' })
      }

      const alreadyMember = await workspaceMemberRepo.isMemberByEmail(ctx.workspaceId, input.email)
      if (alreadyMember) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User is already a member of this workspace' })
      }

      const workspace = await findById(ctx.workspaceId)
      if (!workspace) throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found' })

      const invite = await inviteRepo.create({
        workspaceId: ctx.workspaceId,
        email: input.email,
        role: input.role,
      })

      try {
        await sendInviteEmail({
          toEmail: input.email,
          inviterName: ctx.session.user.name ?? ctx.session.user.email,
          workspaceName: workspace.name,
          role: input.role,
          inviteUrl: `${env.BETTER_AUTH_URL}/invite/${invite.token}`,
        })
      } catch {
        await inviteRepo.revoke(invite.id, ctx.workspaceId)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send invite email',
        })
      }

      return { success: true, email: input.email }
    }),

  listPendingInvites: protectedAdminProcedure.query(({ ctx }) =>
    inviteRepo.listPending(ctx.workspaceId),
  ),

  revokeInvite: protectedAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => inviteRepo.revoke(input.id, ctx.workspaceId)),
})
