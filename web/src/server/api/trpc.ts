import { initTRPC, TRPCError } from '@trpc/server'
import { getSession } from '../../lib/session.ts'
import { findByUserId } from '@tokenlens/shared/workspaceRepo'
import type { Session } from '../../lib/auth.ts'

type Context = {
  session: Session | null
  workspaceId: string | null
}

export async function createContext(): Promise<Context> {
  const session = await getSession()
  if (!session) return { session: null, workspaceId: null }
  const workspace = await findByUserId(session.user.id)
  return { session, workspaceId: workspace?.id ?? null }
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
