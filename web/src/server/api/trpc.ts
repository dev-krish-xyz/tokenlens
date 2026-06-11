import { initTRPC, TRPCError } from '@trpc/server'
import { getSession } from '../../lib/session.ts'
import { findByUserId } from '@tokenlens/shared/workspaceRepo'
import * as workspaceMemberRepo from '@tokenlens/shared/workspaceMemberRepo'
import type { Session } from '../../lib/auth.ts'
import type { WorkspaceRole } from '@tokenlens/shared'
import { hasMinimumRole } from '@tokenlens/shared'

type Context = {
  session: Session | null
  workspaceId: string | null
  userRole: WorkspaceRole | null
}

export async function createContext(): Promise<Context> {
  const session = await getSession()
  if (!session) return { session: null, workspaceId: null, userRole: null }
  const workspace = await findByUserId(session.user.id)
  const userRole = workspace
    ? await workspaceMemberRepo.getRoleForUser(workspace.id, session.user.id)
    : null
  return { session, workspaceId: workspace?.id ?? null, userRole }
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

export const protectedWorkspaceProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  if (!ctx.workspaceId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No workspace found for this user' })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      workspaceId: ctx.workspaceId,
    },
  })
})

export const protectedMemberProcedure = protectedWorkspaceProcedure.use(({ ctx, next }) => {
  if (!ctx.userRole || !hasMinimumRole(ctx.userRole, 'member')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Member role required' })
  }
  return next({ ctx })
})

export const protectedAdminProcedure = protectedWorkspaceProcedure.use(({ ctx, next }) => {
  if (ctx.userRole !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin role required' })
  }
  return next({ ctx })
})
