'use client'
import { useState, useEffect, useRef } from 'react'
import { useQueryState, parseAsInteger } from 'nuqs'
import { trpc } from '../../../../trpc/client.ts'

const PROVIDER_BADGE: Record<string, string> = {
  openai: 'bg-blue-100 text-blue-800',
  anthropic: 'bg-orange-100 text-orange-800',
  gemini: 'bg-green-100 text-green-800',
}

const VALID_PROVIDERS = ['openai', 'anthropic', 'gemini'] as const
type ValidProvider = (typeof VALID_PROVIDERS)[number]

function asProvider(p: string | null): ValidProvider | undefined {
  if (!p) return undefined
  return (VALID_PROVIDERS as readonly string[]).includes(p) ? (p as ValidProvider) : undefined
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z')
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  return `${Math.floor(diffHour / 24)}d ago`
}

function latencyClass(ms: number): string {
  if (ms < 500) return 'text-green-600'
  if (ms <= 2000) return 'text-yellow-600'
  return 'text-red-600'
}

function statusBadgeClass(code: number): string {
  if (code >= 500) return 'bg-red-100 text-red-700'
  if (code >= 400) return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
}

const DATE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
]

const LIMIT = 50

function TableHeaders() {
  return (
    <>
      <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Time</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500">Provider</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500">Model</th>
      <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Tokens In</th>
      <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Tokens Out</th>
      <th className="text-right px-4 py-3 font-medium text-gray-500">Cost</th>
      <th className="text-right px-4 py-3 font-medium text-gray-500">Latency</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500">Env</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500">User ID</th>
    </>
  )
}

export default function LogsPage() {
  const [days, setDays] = useQueryState('days', parseAsInteger.withDefault(7))
  const [model, setModel] = useQueryState('model')
  const [provider, setProvider] = useQueryState('provider')
  const [userId, setUserId] = useQueryState('userId')
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))

  const offset = (page - 1) * LIMIT

  const [modelInput, setModelInput] = useState(model ?? '')
  const [userIdInput, setUserIdInput] = useState(userId ?? '')
  const modelMounted = useRef(false)
  const userIdMounted = useRef(false)

  useEffect(() => {
    if (!modelMounted.current) {
      modelMounted.current = true
      return
    }
    const t = setTimeout(() => {
      void setModel(modelInput || null)
      void setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [modelInput]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userIdMounted.current) {
      userIdMounted.current = true
      return
    }
    const t = setTimeout(() => {
      void setUserId(userIdInput || null)
      void setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [userIdInput]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = !!model || !!provider || !!userId || days !== 7

  function clearFilters() {
    setModelInput('')
    setUserIdInput('')
    void setModel(null)
    void setProvider(null)
    void setUserId(null)
    void setDays(7)
    void setPage(1)
  }

  const { data, isLoading } = trpc.cost.getRequestLogs.useQuery({
    days,
    model: model ?? undefined,
    provider: asProvider(provider),
    userId: userId ?? undefined,
    limit: LIMIT,
    offset,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const start = Math.min(offset + 1, total)
  const end = Math.min(offset + LIMIT, total)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Request Logs</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                void setDays(opt.value)
                void setPage(1)
              }}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                days === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <input
          value={modelInput}
          onChange={(e) => setModelInput(e.target.value)}
          placeholder="Filter by model"
          className="w-44 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <select
          value={provider ?? ''}
          onChange={(e) => {
            void setProvider(e.target.value || null)
            void setPage(1)
          }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All providers</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="gemini">Gemini</option>
        </select>

        <input
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          placeholder="Filter by customer ID"
          className="w-48 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <TableHeaders />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            No requests match your filters
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <TableHeaders />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.requestId}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td
                    className="px-4 py-3 text-gray-500 whitespace-nowrap"
                    title={row.createdAt}
                  >
                    {formatRelative(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_BADGE[row.provider] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {row.provider}
                    </span>
                  </td>
                  <td
                    className="max-w-[160px] truncate px-4 py-3 font-mono text-gray-800"
                    title={row.model}
                  >
                    {row.model}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {row.tokensIn.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {row.tokensOut.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-800">
                    ${row.costUsd.toFixed(6)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${latencyClass(row.latencyMs)}`}>
                    {row.latencyMs}ms
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.statusCode)}`}
                    >
                      {row.statusCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{row.envTag || '—'}</td>
                  <td className="px-4 py-3">
                    {row.userIdTag ? (
                      <span className="font-mono text-gray-700" title={row.userIdTag}>
                        {row.userIdTag.length > 20
                          ? `${row.userIdTag.slice(0, 20)}…`
                          : row.userIdTag}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && rows.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {start}–{end} of {total} results
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => void setPage(page - 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={offset + LIMIT >= total}
              onClick={() => void setPage(page + 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
