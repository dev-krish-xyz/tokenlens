import { eq } from 'drizzle-orm'
import { db } from '../client.ts'
import { workspaces, workspace_members, users } from '../schema.ts'
import type { Workspace, NewWorkspace } from '../schema.ts'

export async function createWithAdmin(userId: string, userEmail: string): Promise<Workspace> {
  const workspaceName = `${userEmail.split('@')[0]}'s workspace`
  return db.transaction(async (tx) => {
    const [workspace] = await tx.insert(workspaces).values({ name: workspaceName } satisfies NewWorkspace).returning()
    if (!workspace) throw new Error('Workspace insert returned no rows')
    // Insert shared user row — may already exist on retry, use onConflictDoNothing
    await tx
      .insert(users)
      .values({ id: userId, email: userEmail })
      .onConflictDoNothing()
    await tx.insert(workspace_members).values({
      workspace_id: workspace.id,
      user_id: userId,
      role: 'admin',
    })
    return workspace
  })
}

export async function findByUserId(userId: string): Promise<Workspace | null> {
  const rows = await db
    .select({ workspace: workspaces })
    .from(workspace_members)
    .innerJoin(workspaces, eq(workspace_members.workspace_id, workspaces.id))
    .where(eq(workspace_members.user_id, userId))
    .limit(1)
  return rows[0]?.workspace ?? null
}

export async function findById(id: string): Promise<Workspace | null> {
  const rows = await db.select().from(workspaces).where(eq(workspaces.id, id))
  return rows[0] ?? null
}
