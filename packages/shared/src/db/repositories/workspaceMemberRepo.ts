import { eq, and } from 'drizzle-orm'
import { db } from '../client.ts'
import { workspace_members, users } from '../schema.ts'
import type { WorkspaceRole } from '../../types.ts'

export async function getRoleForUser(
  workspaceId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const rows = await db
    .select({ role: workspace_members.role })
    .from(workspace_members)
    .where(and(eq(workspace_members.workspace_id, workspaceId), eq(workspace_members.user_id, userId)))
    .limit(1)
  const role = rows[0]?.role
  return role ? (role as WorkspaceRole) : null
}

export async function listMembers(workspaceId: string): Promise<
  Array<{
    userId: string
    email: string
    name: string | null
    role: WorkspaceRole
    joinedAt: Date
  }>
> {
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      role: workspace_members.role,
      joinedAt: workspace_members.created_at,
    })
    .from(workspace_members)
    .innerJoin(users, eq(users.id, workspace_members.user_id))
    .where(eq(workspace_members.workspace_id, workspaceId))
    .orderBy(workspace_members.created_at)
  return rows.map((r) => ({
    userId: r.userId,
    email: r.email,
    name: r.name,
    role: r.role as WorkspaceRole,
    joinedAt: r.joinedAt ?? new Date(),
  }))
}

export async function updateRole(
  workspaceId: string,
  targetUserId: string,
  newRole: WorkspaceRole,
  requestingUserId: string
): Promise<void> {
  if (targetUserId === requestingUserId) {
    throw new Error('Cannot change your own role')
  }
  await db
    .update(workspace_members)
    .set({ role: newRole })
    .where(and(eq(workspace_members.workspace_id, workspaceId), eq(workspace_members.user_id, targetUserId)))
}

export async function removeMember(
  workspaceId: string,
  targetUserId: string,
  requestingUserId: string
): Promise<void> {
  if (targetUserId === requestingUserId) {
    throw new Error('Cannot remove yourself from workspace')
  }
  await db
    .delete(workspace_members)
    .where(and(eq(workspace_members.workspace_id, workspaceId), eq(workspace_members.user_id, targetUserId)))
}
