import type { Job } from 'bullmq'
import type { AlertJobData } from '@tokenlens/shared/queues/types'
import { listByWorkspace as listAlertConfigs } from '@tokenlens/shared/alertConfigRepo'
import { findByWorkspace as findKeysByWorkspace, findById as findKeyById } from '@tokenlens/shared/virtualKeyRepo'
import { getBudgetCap } from '@tokenlens/shared/workspaceRepo'
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
          dedupKey: `alert:sent:ws:${workspaceId}:${getHourBucket()}`,
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
          dedupKey: `alert:sent:${key.id}:${getHourBucket()}`,
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
  if (job.data.type === 'budget') {
    await processBudgetAlerts(job.data.workspaceId)
    return
  }

  if (job.data.type === 'anomaly') {
    const key = await findKeyById(job.data.virtualKeyId)
    const configs = await listAlertConfigs(job.data.workspaceId)
    const activeConfig = configs.find((c) => c.is_active)
    if (!activeConfig) return

    const anomalyPayload: Parameters<typeof maybeFireAlert>[0]['payload'] = {
      type: 'anomaly',
      keyName: key?.name ?? job.data.virtualKeyId,
      workspaceId: job.data.workspaceId,
      message: `Unusual spend spike: ${job.data.multiplier} above normal for this hour ($${job.data.spend?.toFixed(4) ?? '0.0000'})`,
    }
    if (job.data.spend !== undefined) anomalyPayload.spend = job.data.spend

    await maybeFireAlert({
      dedupKey: `alert:sent:anomaly:${job.data.virtualKeyId}:${getHourBucket()}`,
      cooldownMin: 60,
      channel: activeConfig.channel,
      payload: anomalyPayload,
    })
  }
}
