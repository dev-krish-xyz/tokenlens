import { eq, and, desc } from 'drizzle-orm'
import { db } from '../client.ts'
import { virtual_keys } from '../schema.ts'
import type { VirtualKey, NewVirtualKey } from '../schema.ts'
import { AppError } from '../../errors.ts'

type SafeVirtualKey = Omit<VirtualKey, 'encrypted_key'>

export async function findById(id: string): Promise<VirtualKey | null> {
  const rows = await db
    .select()
    .from(virtual_keys)
    .where(and(eq(virtual_keys.id, id), eq(virtual_keys.is_active, true)))
  return rows[0] ?? null
}

export async function findByWorkspace(workspaceId: string): Promise<SafeVirtualKey[]> {
  const rows = await db
    .select()
    .from(virtual_keys)
    .where(and(eq(virtual_keys.workspace_id, workspaceId), eq(virtual_keys.is_active, true)))
    .orderBy(desc(virtual_keys.created_at))
  return rows.map(({ encrypted_key: _omit, ...safe }) => safe)
}

export async function create(data: NewVirtualKey): Promise<VirtualKey> {
  const rows = await db.insert(virtual_keys).values(data).returning()
  const row = rows[0]
  if (row === undefined) throw new AppError('Insert returned no rows', 'DB_ERROR', 500)
  return row
}

export async function softDelete(id: string, workspaceId: string): Promise<void> {
  await db
    .update(virtual_keys)
    .set({ is_active: false })
    .where(and(eq(virtual_keys.id, id), eq(virtual_keys.workspace_id, workspaceId)))
}

export async function updateBudget(
  id: string,
  workspaceId: string,
  budgetCap: number | null
): Promise<SafeVirtualKey | null> {
  const rows = await db
    .update(virtual_keys)
    .set({ budget_cap: budgetCap !== null ? String(budgetCap) : null })
    .where(and(eq(virtual_keys.id, id), eq(virtual_keys.workspace_id, workspaceId)))
    .returning()
  const row = rows[0]
  if (!row) return null
  const { encrypted_key: _omit, ...safe } = row
  return safe
}
