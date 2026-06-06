import { clickhouseClient } from './client.ts'

type DailySpendRow = { day: string; total_cost: string; request_count: string }
type TopModelRow = { model: string; provider: string; total_cost: string; request_count: string }
type SummaryRow = {
  total_cost: string
  total_requests: string
  avg_latency_ms: string
  unique_models: string
}

export async function getDailySpend(
  workspaceId: string,
  days: number
): Promise<Array<{ day: string; totalCost: number; requestCount: number }>> {
  const result = await clickhouseClient.query({
    query: `
      SELECT
        toDate(created_at) AS day,
        sum(cost_usd)      AS total_cost,
        count()            AS request_count
      FROM request_logs
      WHERE workspace_id = {workspaceId: String}
        AND created_at >= now() - INTERVAL {days: UInt32} DAY
      GROUP BY day
      ORDER BY day ASC
    `,
    query_params: { workspaceId, days },
    format: 'JSONEachRow',
  })
  const rows = await result.json<DailySpendRow>()
  return rows.map((r) => ({
    day: r.day,
    totalCost: Number(r.total_cost),
    requestCount: Number(r.request_count),
  }))
}

export async function getTopModels(
  workspaceId: string,
  days: number
): Promise<Array<{ model: string; provider: string; totalCost: number; requestCount: number }>> {
  const result = await clickhouseClient.query({
    query: `
      SELECT
        model,
        provider,
        sum(cost_usd) AS total_cost,
        count()       AS request_count
      FROM request_logs
      WHERE workspace_id = {workspaceId: String}
        AND created_at >= now() - INTERVAL {days: UInt32} DAY
      GROUP BY model, provider
      ORDER BY total_cost DESC
      LIMIT 10
    `,
    query_params: { workspaceId, days },
    format: 'JSONEachRow',
  })
  const rows = await result.json<TopModelRow>()
  return rows.map((r) => ({
    model: r.model,
    provider: r.provider,
    totalCost: Number(r.total_cost),
    requestCount: Number(r.request_count),
  }))
}

export async function getSummaryStats(
  workspaceId: string,
  days: number
): Promise<{
  totalCost: number
  totalRequests: number
  avgLatencyMs: number
  uniqueModels: number
}> {
  const result = await clickhouseClient.query({
    query: `
      SELECT
        sum(cost_usd)       AS total_cost,
        count()             AS total_requests,
        avg(latency_ms)     AS avg_latency_ms,
        uniq(model)         AS unique_models
      FROM request_logs
      WHERE workspace_id = {workspaceId: String}
        AND created_at >= now() - INTERVAL {days: UInt32} DAY
    `,
    query_params: { workspaceId, days },
    format: 'JSONEachRow',
  })
  const rows = await result.json<SummaryRow>()
  const row = rows[0] ?? { total_cost: '0', total_requests: '0', avg_latency_ms: '0', unique_models: '0' }
  return {
    totalCost: Number(row.total_cost),
    totalRequests: Number(row.total_requests),
    avgLatencyMs: Number(row.avg_latency_ms),
    uniqueModels: Number(row.unique_models),
  }
}
