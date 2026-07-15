import type { Job } from 'bullmq'
import { clickhouseClient } from '@tokenlens/shared'
import { alertQueue, anomalyQueue } from '@tokenlens/shared/queues/definitions'
import { anomalyJobSchema, type AnomalyJobData, type AlertJobData } from '@tokenlens/shared/queues/types'
import { hashVirtualKeyId } from '@tokenlens/shared/keyVault'
import { findByWorkspace as findKeysByWorkspace } from '@tokenlens/shared/virtualKeyRepo'
import { listAllWorkspaceIds } from '@tokenlens/shared/workspaceRepo'

type HourlySpendRow = { hourly_spend: string }
type BaselineRow = { baseline: string }

export async function processAnomalyCheck(job: Job<AnomalyJobData>): Promise<void> {
  const data = anomalyJobSchema.parse(job.data)

  if ('scope' in data) {
    const workspaceIds = await listAllWorkspaceIds()
    for (const workspaceId of workspaceIds) {
      const keys = await findKeysByWorkspace(workspaceId)
      for (const key of keys) {
        await anomalyQueue.add('anomaly-check', {
          virtualKeyId: key.id,
          workspaceId,
        } satisfies AnomalyJobData)
      }
    }
    return
  }

  const { virtualKeyId, workspaceId } = data
  // ClickHouse stores hashVirtualKeyId() digests, never raw key ids.
  const hashedKeyId = hashVirtualKeyId(virtualKeyId)

  const currentResult = await clickhouseClient.query({
    query: `
      SELECT sum(cost_usd) AS hourly_spend
      FROM request_logs
      WHERE virtual_key_id = {virtualKeyId: String}
        AND created_at >= now() - INTERVAL 1 HOUR
    `,
    query_params: { virtualKeyId: hashedKeyId },
    format: 'JSONEachRow',
  })
  const currentRows = await currentResult.json<HourlySpendRow>()
  const currentHourSpend = Number(currentRows[0]?.hourly_spend ?? 0)

  const baselineResult = await clickhouseClient.query({
    query: `
      SELECT avg(hourly_total) AS baseline
      FROM (
        SELECT
          toStartOfHour(created_at) AS hour,
          sum(cost_usd) AS hourly_total
        FROM request_logs
        WHERE virtual_key_id = {virtualKeyId: String}
          AND created_at >= now() - INTERVAL 7 DAY
          AND toHour(created_at) = toHour(now())
        GROUP BY hour
      )
    `,
    query_params: { virtualKeyId: hashedKeyId },
    format: 'JSONEachRow',
  })
  const baselineRows = await baselineResult.json<BaselineRow>()
  const baseline = Number(baselineRows[0]?.baseline ?? 0)

  if (baseline < 0.0001) return

  if (currentHourSpend > baseline * 3) {
    const multiplier = (currentHourSpend / baseline).toFixed(1)

    await alertQueue.add('alert', {
      type: 'anomaly',
      workspaceId,
      virtualKeyId,
      keyName: virtualKeyId,
      spend: currentHourSpend,
      baseline,
      multiplier: `${multiplier}x`,
    } satisfies AlertJobData)
  }
}
