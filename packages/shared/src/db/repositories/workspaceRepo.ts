import { eq } from 'drizzle-orm'
import { db } from '../client.ts'
import { dragonflyClient } from '../../dragonfly/client.ts'
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

export async function updateName(id: string, name: string): Promise<void> {
  await db.update(workspaces).set({ name }).where(eq(workspaces.id, id))
}

export async function updateBudgetCap(id: string, budgetCap: number | null): Promise<void> {
  await db
    .update(workspaces)
    .set({ budget_cap: budgetCap !== null ? String(budgetCap) : null })
    .where(eq(workspaces.id, id))
}

export async function getBudgetCap(workspaceId: string): Promise<number | null> {
  const cached = await dragonflyClient.get(`wscap:${workspaceId}`)
  if (cached !== null) return cached === 'null' ? null : parseFloat(cached)

  const rows = await db.select({ budget_cap: workspaces.budget_cap }).from(workspaces).where(eq(workspaces.id, workspaceId))
  const cap = rows[0]?.budget_cap ? parseFloat(rows[0].budget_cap) : null

  await dragonflyClient.setex(`wscap:${workspaceId}`, 300, cap === null ? 'null' : String(cap))
  return cap
}

export async function invalidateBudgetCapCache(workspaceId: string): Promise<void> {
  await dragonflyClient.del(`wscap:${workspaceId}`)
}

export async function listAllWorkspaceIds(): Promise<string[]> {
  const rows = await db.select({ id: workspaces.id }).from(workspaces)
  return rows.map((r) => r.id)
}
