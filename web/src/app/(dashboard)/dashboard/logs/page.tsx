'use client'
import { useState, useEffect, useRef } from 'react'
import { useQueryState, parseAsInteger } from 'nuqs'
import { trpc } from '../../../../trpc/client.ts'

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

function statusChip(code: number): { color: string } {
  if (code >= 500) return { color: '#EF4444' }
  if (code >= 400) return { color: '#F59E0B' }
  return { color: '#10B981' }
}

const DATE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
]

const LIMIT = 50

const TH_STYLE: React.CSSProperties = {
  padding: '9px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 400,
  color: 'var(--t3)',
  background: 'var(--bg)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

const TD_STYLE: React.CSSProperties = {
  padding: '11px 16px',
  fontSize: 12,
  borderBottom: '1px solid var(--border)',
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
    if (!modelMounted.current) { modelMounted.current = true; return }
    const t = setTimeout(() => { void setModel(modelInput || null); void setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [modelInput]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userIdMounted.current) { userIdMounted.current = true; return }
    const t = setTimeout(() => { void setUserId(userIdInput || null); void setPage(1) }, 300)
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
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Request Logs
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
            All gateway requests with cost, latency, and status
          </div>
        </div>
      </div>

      {/* Table card */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        {/* Card header + filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500 }}>Request Logs</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Date range */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                background: 'var(--border)',
                borderRadius: 10,
                padding: 4,
              }}
            >
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { void setDays(opt.value); void setPage(1) }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    background: days === opt.value ? 'var(--surface)' : 'transparent',
                    color: days === opt.value ? 'var(--t1)' : 'var(--t3)',
                    boxShadow: days === opt.value ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <input
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              placeholder="Filter by model…"
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 12,
                background: 'var(--surface)',
                color: 'var(--t1)',
                outline: 'none',
                fontFamily: 'monospace',
                width: 160,
              }}
            />

            <select
              value={provider ?? ''}
              onChange={(e) => { void setProvider(e.target.value || null); void setPage(1) }}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 12,
                background: 'var(--surface)',
                color: 'var(--t2)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">All providers</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Gemini</option>
            </select>

            <input
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              placeholder="Customer ID…"
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 12,
                background: 'var(--surface)',
                color: 'var(--t1)',
                outline: 'none',
                fontFamily: 'monospace',
                width: 140,
              }}
            />

            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: 12,
                  color: 'var(--t2)',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Request ID', 'Model', 'Status', 'Tokens In', 'Tokens Out', 'Cost', 'Latency', 'Time', 'Env', 'Customer'].map((h) => (
                    <th key={h} style={TH_STYLE}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} style={TD_STYLE}>
                        <div
                          style={{ height: 14, background: '#F0F0F0', borderRadius: 3 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : rows.length === 0 ? (
            <div
              style={{
                padding: '48px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: '#F5F5F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                  fontSize: 22,
                }}
              >
                🔍
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No Matching Logs</div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--t3)',
                  maxWidth: 220,
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                {hasFilters
                  ? 'Try adjusting your filters or date range.'
                  : 'No requests have been logged yet.'}
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    fontSize: 12,
                    color: 'var(--t2)',
                    cursor: 'pointer',
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Request ID', 'Model', 'Status', 'Tokens In', 'Tokens Out', 'Cost', 'Latency', 'Time', 'Env', 'Customer'].map((h) => (
                    <th key={h} style={TH_STYLE}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const sc = statusChip(row.statusCode)
                  return (
                    <tr
                      key={row.requestId}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.cursor = 'default' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                    >
                      <td style={{ ...TD_STYLE, fontFamily: 'monospace', fontSize: 11, color: 'var(--t3)' }}>
                        {row.requestId.slice(0, 12)}
                      </td>
                      <td style={{ ...TD_STYLE, fontFamily: 'monospace', fontSize: 11, maxWidth: 140 }}>
                        <span
                          style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={row.model}
                        >
                          {row.model}
                        </span>
                      </td>
                      <td style={TD_STYLE}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: sc.color,
                            fontFamily: 'monospace',
                          }}
                        >
                          {row.statusCode}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, fontFamily: 'monospace', textAlign: 'right' }}>
                        {row.tokensIn.toLocaleString()}
                      </td>
                      <td style={{ ...TD_STYLE, fontFamily: 'monospace', textAlign: 'right' }}>
                        {row.tokensOut.toLocaleString()}
                      </td>
                      <td style={{ ...TD_STYLE, fontFamily: 'monospace', textAlign: 'right' }}>
                        ${row.costUsd.toFixed(6)}
                      </td>
                      <td
                        style={{
                          ...TD_STYLE,
                          fontFamily: 'monospace',
                          textAlign: 'right',
                          color:
                            row.latencyMs < 500
                              ? '#16A34A'
                              : row.latencyMs <= 2000
                                ? 'var(--warn)'
                                : 'var(--err)',
                        }}
                      >
                        {row.latencyMs}ms
                      </td>
                      <td style={{ ...TD_STYLE, fontFamily: 'monospace', fontSize: 11, color: 'var(--t3)' }}>
                        {formatRelative(row.createdAt)}
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: 11, color: 'var(--t3)' }}>
                        {row.envTag || '—'}
                      </td>
                      <td style={{ ...TD_STYLE, fontFamily: 'monospace', fontSize: 11 }}>
                        {row.userIdTag ? (
                          <span title={row.userIdTag}>
                            {row.userIdTag.length > 18
                              ? `${row.userIdTag.slice(0, 18)}…`
                              : row.userIdTag}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--t3)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && total > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              fontSize: 12,
              color: 'var(--t3)',
              borderTop: '1px solid var(--border)',
            }}
          >
            <span>
              Showing {start}–{end} of {total.toLocaleString()} requests
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                disabled={page <= 1}
                onClick={() => void setPage(page - 1)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: 11,
                  color: 'var(--t2)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.4 : 1,
                }}
              >
                ← Prev
              </button>
              <button
                disabled={offset + LIMIT >= total}
                onClick={() => void setPage(page + 1)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: 11,
                  color: 'var(--t2)',
                  cursor: offset + LIMIT >= total ? 'not-allowed' : 'pointer',
                  opacity: offset + LIMIT >= total ? 0.4 : 1,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
