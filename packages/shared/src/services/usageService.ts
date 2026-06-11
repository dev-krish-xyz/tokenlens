import { clickhouseClient } from '../clickhouse/client.ts'

type CountRow = { cnt: string }

export async function getMonthlyRequestCount(workspaceId: string): Promise<number> {
  const result = await clickhouseClient.query({
    query: `
      SELECT count() AS cnt
      FROM request_logs
      WHERE workspace_id = {workspaceId: String}
        AND toYYYYMM(created_at) = toYYYYMM(now())
    `,
    query_params: { workspaceId },
    format: 'JSONEachRow',
  })
  const rows = await result.json<CountRow>()
  return Number(rows[0]?.cnt ?? 0)
}
