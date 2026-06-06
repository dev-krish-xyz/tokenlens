import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from './auth.ts'
import { findByUserId } from '@tokenlens/shared/workspaceRepo'
import type { Workspace } from '@tokenlens/shared'

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireSession() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function requireWorkspace(): Promise<{ session: NonNullable<Awaited<ReturnType<typeof getSession>>>; workspace: Workspace }> {
  const session = await requireSession()
  const workspace = await findByUserId(session.user.id)
  if (!workspace) redirect('/login')
  return { session, workspace }
}
