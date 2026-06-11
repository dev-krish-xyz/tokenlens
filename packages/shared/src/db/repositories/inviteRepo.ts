import { randomBytes } from 'crypto'
import { eq, and, gt, isNull, desc } from 'drizzle-orm'
import { db } from '../client.ts'
import { workspace_invites, workspace_members } from '../schema.ts'
import type { WorkspaceInvite } from '../schema.ts'
import type { WorkspaceRole } from '../../types.ts'

export async function create(data: {
  workspaceId: string
  email: string
  role: WorkspaceRole
}): Promise<WorkspaceInvite> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const [row] = await db
    .insert(workspace_invites)
    .values({
      workspace_id: data.workspaceId,
      email: data.email,
      role: data.role,
      token,
      expires_at: expiresAt,
    })
    .returning()
  if (!row) throw new Error('Invite insert returned no rows')
  return row
}

export async function findByToken(token: string): Promise<WorkspaceInvite | null> {
  const rows = await db
    .select()
    .from(workspace_invites)
    .where(eq(workspace_invites.token, token))
    .limit(1)
  return rows[0] ?? null
}

export async function accept(token: string, userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(workspace_invites)
      .where(
        and(
          eq(workspace_invites.token, token),
          isNull(workspace_invites.accepted_at),
          gt(workspace_invites.expires_at, new Date()),
        ),
      )
      .limit(1)

    const invite = rows[0]
    if (!invite) throw new Error('Invite invalid or expired')

    const existingRows = await tx
      .select({ workspace_id: workspace_members.workspace_id })
      .from(workspace_members)
      .where(
        and(
          eq(workspace_members.workspace_id, invite.workspace_id),
          eq(workspace_members.user_id, userId),
        ),
      )
      .limit(1)

    if (existingRows.length === 0) {
      await tx.insert(workspace_members).values({
        workspace_id: invite.workspace_id,
        user_id: userId,
        role: invite.role,
      })
    }

    await tx
      .update(workspace_invites)
      .set({ accepted_at: new Date() })
      .where(eq(workspace_invites.token, token))
  })
}

export async function listPending(workspaceId: string): Promise<WorkspaceInvite[]> {
  return db
    .select()
    .from(workspace_invites)
    .where(
      and(
        eq(workspace_invites.workspace_id, workspaceId),
        isNull(workspace_invites.accepted_at),
        gt(workspace_invites.expires_at, new Date()),
      ),
    )
    .orderBy(desc(workspace_invites.created_at))
}

export async function revoke(id: string, workspaceId: string): Promise<void> {
  await db
    .delete(workspace_invites)
    .where(and(eq(workspace_invites.id, id), eq(workspace_invites.workspace_id, workspaceId)))
}
