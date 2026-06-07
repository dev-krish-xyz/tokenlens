'use client'
import { useQueryState, parseAsInteger } from 'nuqs'
import { trpc } from '../../../../trpc/client.ts'

const DATE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
]

function CustomerTableHeaders() {
  return (
    <>
      <th className="text-left px-4 py-3 font-medium text-gray-500">Customer ID</th>
      <th className="text-right px-4 py-3 font-medium text-gray-500">Total Cost</th>
      <th className="text-right px-4 py-3 font-medium text-gray-500">Requests</th>
      <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
        Avg Cost/Req
      </th>
      <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
        Avg Latency
      </th>
      <th className="text-left px-4 py-3 font-medium text-gray-500">Top Model</th>
    </>
  )
}

export default function CustomersPage() {
  const [days, setDays] = useQueryState('days', parseAsInteger.withDefault(30))
  const { data = [], isLoading } = trpc.cost.getPerCustomerCost.useQuery({ days })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Customer Cost Attribution</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            AI spend broken down by customer ID (X-TL-User-Id header)
          </p>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-1">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => void setDays(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                days === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <CustomerTableHeaders />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : data.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
          <p className="font-medium text-gray-700">No customer attribution data yet.</p>
          <p className="text-sm text-gray-500">
            Tag your requests with the X-TL-User-Id header to track per-customer costs.
          </p>
          <pre className="mx-auto max-w-xl overflow-x-auto rounded-lg bg-gray-900 px-4 py-3 text-left text-xs text-green-400">{`curl https://your-gateway.com/v1/chat/completions \\
  -H 'Authorization: Bearer tl-vk-your-key' \\
  -H 'X-TL-User-Id: customer_123' \\
  -H 'Content-Type: application/json' \\
  -d '{"model":"gpt-4o-mini","messages":[...]}'`}</pre>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <CustomerTableHeaders />
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={row.userIdTag}
                  className={`border-b border-gray-100 last:border-0 ${
                    index < 3
                      ? 'bg-red-50 hover:bg-red-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-gray-800">{row.userIdTag}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    ${row.totalCost.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {row.requestCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">
                    ${row.avgCostPerReq.toFixed(6)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {Math.round(row.avgLatencyMs)}ms
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-500">{row.topModel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
