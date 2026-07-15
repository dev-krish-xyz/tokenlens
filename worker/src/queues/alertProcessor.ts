import type { Job } from 'bullmq'
import { alertJobSchema, type AlertJobData } from '@tokenlens/shared/queues/types'
import { listByWorkspace as listAlertConfigs } from '@tokenlens/shared/alertConfigRepo'
import { findByWorkspace as findKeysByWorkspace, findById as findKeyById } from '@tokenlens/shared/virtualKeyRepo'
import { getBudgetCap, listAllWorkspaceIds } from '@tokenlens/shared/workspaceRepo'
import { getCurrentSpend } from '@tokenlens/shared/services/budgetService'
import { maybeFireAlert, getHourBucket } from '../services/alertSender.ts'

export async function processBudgetAlerts(workspaceId: string): Promise<void> {
  const keys = await findKeysByWorkspace(workspaceId)
  const wsCap = await getBudgetCap(workspaceId)
  const configs = await listAlertConfigs(workspaceId)
  const activeConfigs = configs.filter((c) => c.is_active)
  if (activeConfigs.length === 0) return

  if (wsCap !== null) {
    const { wsSpend } = await getCurrentSpend('_', workspaceId)
    const pct = (wsSpend / wsCap) * 100
    for (const config of activeConfigs) {
      if (pct >= config.threshold_pct) {
        await maybeFireAlert({
          // Dedup per config so one channel firing doesn't suppress the others.
          dedupKey: `alert:sent:ws:${workspaceId}:${config.id}:${getHourBucket()}`,
          cooldownMin: config.cooldown_min ?? 60,
          channel: config.channel,
          payload: {
            type: 'budget',
            keyName: 'Workspace',
            workspaceId,
            message: `Workspace spend at ${pct.toFixed(1)}% of cap`,
            spend: wsSpend,
            cap: wsCap,
            percentage: pct,
          },
        })
      }
    }
  }

  for (const key of keys) {
    if (!key.budget_cap) continue
    const { keySpend } = await getCurrentSpend(key.id, workspaceId)
    const pct = (keySpend / Number(key.budget_cap)) * 100
    for (const config of activeConfigs) {
      if (pct >= config.threshold_pct) {
        await maybeFireAlert({
          dedupKey: `alert:sent:${key.id}:${config.id}:${getHourBucket()}`,
          cooldownMin: config.cooldown_min ?? 60,
          channel: config.channel,
          payload: {
            type: 'budget',
            keyName: key.name,
            workspaceId,
            message: `Key "${key.name}" at ${pct.toFixed(1)}% of cap`,
            spend: keySpend,
            cap: Number(key.budget_cap),
            percentage: pct,
          },
        })
      }
    }
  }
}

export async function processAlertJob(job: Job<AlertJobData>): Promise<void> {
  const data = alertJobSchema.parse(job.data)

  if (data.type === 'budget_sweep') {
    const workspaceIds = await listAllWorkspaceIds()
    for (const workspaceId of workspaceIds) {
      await processBudgetAlerts(workspaceId)
    }
    return
  }

  if (data.type === 'budget') {
    await processBudgetAlerts(data.workspaceId)
    return
  }

  // anomaly
  const key = await findKeyById(data.virtualKeyId)
  const configs = await listAlertConfigs(data.workspaceId)
  const activeConfigs = configs.filter((c) => c.is_active)

  for (const config of activeConfigs) {
    const anomalyPayload: Parameters<typeof maybeFireAlert>[0]['payload'] = {
      type: 'anomaly',
      keyName: key?.name ?? data.virtualKeyId,
      workspaceId: data.workspaceId,
      message: `Unusual spend spike: ${data.multiplier ?? '?'} above normal for this hour ($${data.spend?.toFixed(4) ?? '0.0000'})`,
    }
    if (data.spend !== undefined) anomalyPayload.spend = data.spend

    await maybeFireAlert({
      dedupKey: `alert:sent:anomaly:${data.virtualKeyId}:${config.id}:${getHourBucket()}`,
      cooldownMin: config.cooldown_min ?? 60,
      channel: config.channel,
      payload: anomalyPayload,
    })
  }
}
