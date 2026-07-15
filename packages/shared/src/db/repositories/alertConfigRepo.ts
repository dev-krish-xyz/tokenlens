import { eq, and, asc } from 'drizzle-orm'
import { db } from '../client.ts'
import { alert_configs } from '../schema.ts'
import type { AlertConfig } from '../schema.ts'
import { AppError, ValidationError } from '../../errors.ts'

export async function listByWorkspace(workspaceId: string): Promise<AlertConfig[]> {
  return db
    .select()
    .from(alert_configs)
    .where(eq(alert_configs.workspace_id, workspaceId))
    .orderBy(asc(alert_configs.id))
}

export async function create(data: {
  workspaceId: string
  channel: string
  thresholdPct: number
  cooldownMin?: number
}): Promise<AlertConfig> {
  const [row] = await db
    .insert(alert_configs)
    .values({
      workspace_id: data.workspaceId,
      channel: data.channel,
      threshold_pct: data.thresholdPct,
      cooldown_min: data.cooldownMin ?? 60,
      is_active: true,
    })
    .returning()
  if (!row) throw new AppError('Alert config insert returned no rows', 'DB_ERROR', 500)
  return row
}

export async function update(
  id: string,
  workspaceId: string,
  data: Partial<{
    channel: string
    thresholdPct: number
    cooldownMin: number
    isActive: boolean
  }>
): Promise<AlertConfig> {
  const setValues: Partial<typeof alert_configs.$inferInsert> = {}
  if (data.channel !== undefined) setValues.channel = data.channel
  if (data.thresholdPct !== undefined) setValues.threshold_pct = data.thresholdPct
  if (data.cooldownMin !== undefined) setValues.cooldown_min = data.cooldownMin
  if (data.isActive !== undefined) setValues.is_active = data.isActive

  const [row] = await db
    .update(alert_configs)
    .set(setValues)
    .where(and(eq(alert_configs.id, id), eq(alert_configs.workspace_id, workspaceId)))
    .returning()
  if (!row) throw new ValidationError('Alert config not found')
  return row
}

export async function deleteConfig(id: string, workspaceId: string): Promise<void> {
  await db
    .delete(alert_configs)
    .where(and(eq(alert_configs.id, id), eq(alert_configs.workspace_id, workspaceId)))
}
