'use client'
import { trpc } from '../../trpc/client.ts'

type Props = { days: number }

const PROVIDER_BADGE: Record<string, string> = {
  openai: 'bg-blue-100 text-blue-800',
  anthropic: 'bg-orange-100 text-orange-800',
  gemini: 'bg-green-100 text-green-800',
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-100 animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export function TopModelsTable({ days }: Props) {
  const { data, isLoading } = trpc.cost.getTopModels.useQuery({ days })

  const rows = (data ?? []).slice(0, 10)

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4">
        <p className="text-sm font-medium text-gray-500">Top Models</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-500">Model</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">Provider</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Total Cost</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Requests</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">Avg Cost/Req</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                No model usage for this period
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const avgCost = row.requestCount > 0 ? row.totalCost / row.requestCount : 0
              return (
                <tr
                  key={`${row.provider}:${row.model}`}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-900">{row.model}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_BADGE[row.provider] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {row.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    ${row.totalCost.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {row.requestCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    ${avgCost.toFixed(6)}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
