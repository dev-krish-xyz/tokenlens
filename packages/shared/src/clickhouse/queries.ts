import { clickhouseClient } from './client.ts'

type DailySpendRow = { day: string; total_cost: string; request_count: string }
type TopModelRow = { model: string; provider: string; total_cost: string; request_count: string }
type SummaryRow = {
  total_cost: string
  total_requests: string
  avg_latency_ms: string
  unique_models: string
}
type RequestLogRow = {
  request_id: string
  provider: string
  model: string
  tokens_in: string
  tokens_out: string
  cost_usd: string
  latency_ms: string
  status_code: string
  env_tag: string
  feature_tag: string
  user_id_tag: string
  created_at: string
}
type CountRow = { total: string }
type CustomerCostRow = {
  user_id_tag: string
  total_cost: string
  request_count: string
  avg_cost_per_req: string
  avg_latency_ms: string
  top_model: string
}

type RequestLogFilters = {
  days: number
  model?: string | undefined
  provider?: string | undefined
  userId?: string | undefined
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

function buildConditions(
  workspaceId: string,
  filters: RequestLogFilters
): { conditions: string[]; params: Record<string, unknown> } {
  const conditions = [
    'workspace_id = {workspaceId: String}',
    'created_at >= now() - INTERVAL {days: UInt32} DAY',
  ]
  const params: Record<string, unknown> = { workspaceId, days: filters.days }
  if (filters.model) {
    conditions.push('model = {model: String}')
    params.model = filters.model
  }
  if (filters.provider) {
    conditions.push('provider = {provider: String}')
    params.provider = filters.provider
  }
  if (filters.userId) {
    conditions.push('user_id_tag = {userId: String}')
    params.userId = filters.userId
  }
  return { conditions, params }
}

export async function getRequestLogs(
  workspaceId: string,
  filters: RequestLogFilters & { limit: number; offset: number }
): Promise<
  Array<{
    requestId: string
    provider: string
    model: string
    tokensIn: number
    tokensOut: number
    costUsd: number
    latencyMs: number
    statusCode: number
    envTag: string
    featureTag: string
    userIdTag: string
    createdAt: string
  }>
> {
  const { conditions, params } = buildConditions(workspaceId, filters)
  params.limit = filters.limit
  params.offset = filters.offset

  const result = await clickhouseClient.query({
    query: `
      SELECT
        request_id, provider, model,
        tokens_in, tokens_out, cost_usd,
        latency_ms, status_code,
        env_tag, feature_tag, user_id_tag,
        created_at
      FROM request_logs
      WHERE ${conditions.join('\n        AND ')}
      ORDER BY created_at DESC
      LIMIT {limit: UInt32}
      OFFSET {offset: UInt32}
    `,
    query_params: params,
    format: 'JSONEachRow',
  })
  const rows = await result.json<RequestLogRow>()
  return rows.map((r) => ({
    requestId: r.request_id,
    provider: r.provider,
    model: r.model,
    tokensIn: Number(r.tokens_in),
    tokensOut: Number(r.tokens_out),
    costUsd: Number(r.cost_usd),
    latencyMs: Number(r.latency_ms),
    statusCode: Number(r.status_code),
    envTag: r.env_tag,
    featureTag: r.feature_tag,
    userIdTag: r.user_id_tag,
    createdAt: r.created_at,
  }))
}

export async function getRequestLogCount(
  workspaceId: string,
  filters: RequestLogFilters
): Promise<number> {
  const { conditions, params } = buildConditions(workspaceId, filters)

  const result = await clickhouseClient.query({
    query: `
      SELECT count() AS total
      FROM request_logs
      WHERE ${conditions.join('\n        AND ')}
    `,
    query_params: params,
    format: 'JSONEachRow',
  })
  const rows = await result.json<CountRow>()
  return Number(rows[0]?.total ?? 0)
}

export async function getPerCustomerCost(
  workspaceId: string,
  days: number
): Promise<
  Array<{
    userIdTag: string
    totalCost: number
    requestCount: number
    avgCostPerReq: number
    avgLatencyMs: number
    topModel: string
  }>
> {
  const result = await clickhouseClient.query({
    query: `
      SELECT
        user_id_tag,
        sum(cost_usd)     AS total_cost,
        count()           AS request_count,
        avg(cost_usd)     AS avg_cost_per_req,
        avg(latency_ms)   AS avg_latency_ms,
        topK(1)(model)[1] AS top_model
      FROM request_logs
      WHERE workspace_id = {workspaceId: String}
        AND created_at >= now() - INTERVAL {days: UInt32} DAY
        AND user_id_tag != ''
      GROUP BY user_id_tag
      ORDER BY total_cost DESC
      LIMIT 50
    `,
    query_params: { workspaceId, days },
    format: 'JSONEachRow',
  })
  const rows = await result.json<CustomerCostRow>()
  return rows.map((r) => ({
    userIdTag: r.user_id_tag,
    totalCost: Number(r.total_cost),
    requestCount: Number(r.request_count),
    avgCostPerReq: Number(r.avg_cost_per_req),
    avgLatencyMs: Number(r.avg_latency_ms),
    topModel: r.top_model,
  }))
}
