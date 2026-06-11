'use client'
import Link from 'next/link'
import { useQueryState, parseAsInteger } from 'nuqs'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { trpc } from '../../../trpc/client.ts'
import { IconAlertTriangle, IconX } from '@tabler/icons-react'
import { useState } from 'react'

// ─── helpers ────────────────────────────────────────────────
function fmtCost(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDay(iso: string) {
  const p = iso.split('-').map(Number)
  return new Date((p[0] ?? 2000), (p[1] ?? 1) - 1, p[2] ?? 1)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function barColor(pct: number) {
  if (pct >= 100) return 'var(--err)'
  if (pct >= 80) return 'var(--warn)'
  return 'var(--ok)'
}
function statusChip(pct: number) {
  if (pct >= 100) return { label: 'Blocked', bg: '#FEF2F2', color: '#BA1A1A' }
  if (pct >= 80) return { label: 'Warning', bg: '#FEF3C7', color: '#D97706' }
  return { label: 'Active', bg: '#DCFCE7', color: '#16A34A' }
}

// ─── sub-components ─────────────────────────────────────────
function KpiCard({
  label,
  value,
  delta,
  deltaColor,
}: {
  label: string
  value: React.ReactNode
  delta?: string
  deltaColor?: string
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--t3)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          fontFamily: 'monospace',
          marginBottom: 3,
        }}
      >
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: 11, color: deltaColor ?? 'var(--t3)' }}>{delta}</div>
      )}
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 18px',
      }}
    >
      <div style={{ height: 10, width: 80, background: '#F0F0F0', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 24, width: 100, background: '#F0F0F0', borderRadius: 4, marginBottom: 6 }} />
      <div style={{ height: 10, width: 60, background: '#F0F0F0', borderRadius: 4 }} />
    </div>
  )
}

type TooltipPayload = {
  active?: boolean
  payload?: Array<{ value: number; payload: { day: string; requestCount: number } }>
}

function ChartTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null
  const row = payload[0]
  if (!row) return null
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ fontWeight: 500, color: 'var(--t2)', marginBottom: 2 }}>
        {fmtDay(row.payload.day)}
      </div>
      <div style={{ color: 'var(--t1)', fontFamily: 'monospace' }}>{fmtCost(row.value)}</div>
      <div style={{ color: 'var(--t3)' }}>{row.payload.requestCount.toLocaleString()} reqs</div>
    </div>
  )
}

// ─── page ───────────────────────────────────────────────────
const DATE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
]

export default function DashboardPage() {
  const [days, setDays] = useQueryState('days', parseAsInteger.withDefault(7))
  const [toastDismissed, setToastDismissed] = useState(false)

  const { data: stats, isLoading: statsLoading } = trpc.cost.getSummaryStats.useQuery({ days })
  const { data: dailySpend = [], isLoading: chartLoading } = trpc.cost.getDailySpend.useQuery({ days })
  const { data: topModels = [], isLoading: modelsLoading } = trpc.cost.getTopModels.useQuery({ days })
  const { data: keyBudgets = [], isLoading: budgetLoading } = trpc.budget.getKeyBudgetStatus.useQuery()
  const { data: customers = [], isLoading: customersLoading } = trpc.cost.getPerCustomerCost.useQuery({ days })

  // Find warning keys for toast
  const warningKeys = keyBudgets.filter((kb) => kb.percentage >= 80 && kb.percentage < 100)
  const blockedKeys = keyBudgets.filter((kb) => kb.percentage >= 100)
  const alertKey = blockedKeys[0] ?? warningKeys[0]

  const maxModelCost = Math.max(...topModels.map((m) => m.totalCost), 1)

  return (
    <div style={{ padding: 24 }}>
      {/* Alert toast */}
      {alertKey && !toastDismissed && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid #F0A030',
            borderRadius: 10,
            padding: '11px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 18,
            fontSize: 12,
          }}
        >
          <IconAlertTriangle size={16} color="var(--warn)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            Warning:{' '}
            <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{alertKey.keyName}</span>
            {' '}is at {Math.round(alertKey.percentage)}% of ${alertKey.cap?.toFixed(0)} monthly budget
          </div>
          <Link
            href="/dashboard/budget"
            style={{ fontSize: 12, color: 'var(--pri)', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            View →
          </Link>
          <button
            onClick={() => setToastDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--t3)', display: 'flex' }}
          >
            <IconX size={14} />
          </button>
        </div>
      )}

      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Overview</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Date range tabs */}
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
                onClick={() => void setDays(opt.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: days === opt.value ? 'var(--surface)' : 'transparent',
                  color: days === opt.value ? 'var(--t1)' : 'var(--t3)',
                  boxShadow: days === opt.value ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                  transition: '0.1s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Link
            href="/dashboard/keys"
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              background: 'var(--pri)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            + Create Key
          </Link>
        </div>
      </div>

      {/* KPI cards — 5 col */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="MTD Spend"
              value={fmtCost(stats?.totalCost ?? 0)}
              delta="this period"
              deltaColor="var(--t3)"
            />
            <KpiCard
              label="Requests"
              value={(stats?.totalRequests ?? 0).toLocaleString()}
              delta="total requests"
              deltaColor="var(--t3)"
            />
            <KpiCard
              label="Avg Latency"
              value={`${Math.round(stats?.avgLatencyMs ?? 0)}ms`}
              delta="→ p50"
              deltaColor="var(--t3)"
            />
            <KpiCard
              label="Models Used"
              value={stats?.uniqueModels ?? 0}
              delta="unique models"
              deltaColor="var(--t3)"
            />
            <KpiCard
              label="Budget Status"
              value={
                budgetLoading
                  ? '—'
                  : blockedKeys.length > 0
                    ? `${blockedKeys.length} blocked`
                    : warningKeys.length > 0
                      ? `${warningKeys.length} at risk`
                      : 'Healthy'
              }
              delta={
                budgetLoading
                  ? ''
                  : blockedKeys.length > 0
                    ? 'keys exceeded cap'
                    : warningKeys.length > 0
                      ? '≥80% of cap'
                      : 'all keys within budget'
              }
              deltaColor={
                blockedKeys.length > 0
                  ? 'var(--err)'
                  : warningKeys.length > 0
                    ? 'var(--warn)'
                    : 'var(--ok)'
              }
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Daily spend chart */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500 }}>Daily Spend</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--t3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--pri)',
                    display: 'inline-block',
                  }}
                />
                Spend
              </span>
            </div>
          </div>
          {chartLoading ? (
            <div
              style={{ height: 150, background: '#F5F5F5', borderRadius: 8, animation: 'pulse 1.5s infinite' }}
            />
          ) : dailySpend.length === 0 ? (
            <div
              style={{
                height: 150,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: 'var(--t3)',
              }}
            >
              No spend data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={dailySpend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5A4EC7" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#5A4EC7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tickFormatter={fmtDay}
                  tick={{ fontSize: 9, fill: '#787585' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="totalCost"
                  stroke="#5A4EC7"
                  strokeWidth={2}
                  fill="url(#ga)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#5A4EC7' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By Model */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>By Model</div>
          {modelsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 28, background: '#F5F5F5', borderRadius: 4 }} />
              ))}
            </div>
          ) : topModels.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginTop: 40 }}>
              No model data yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {topModels.slice(0, 5).map((m, i) => {
                const colors = ['#5A4EC7', '#7C6ED4', '#B39DDB', '#D4CBFF', '#EDE9FF']
                const pct = (m.totalCost / maxModelCost) * 100
                return (
                  <div key={m.model}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{m.model}</span>
                      <span style={{ fontFamily: 'monospace' }}>{fmtCost(m.totalCost)}</span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        background: 'var(--border)',
                        borderRadius: 9999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 9999,
                          background: colors[i] ?? '#D4CBFF',
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tables row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Virtual Keys mini */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500 }}>Virtual Keys</div>
            <Link
              href="/dashboard/keys"
              style={{ fontSize: 12, color: 'var(--pri)', textDecoration: 'none' }}
            >
              View all →
            </Link>
          </div>
          {budgetLoading ? (
            <div style={{ padding: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 28, background: '#F5F5F5', borderRadius: 4, marginBottom: 8 }} />
              ))}
            </div>
          ) : keyBudgets.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>
              No virtual keys yet.{' '}
              <Link href="/dashboard/keys" style={{ color: 'var(--pri)' }}>
                Create one
              </Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Key', 'Budget', 'Used', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '9px 16px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 500,
                        color: 'var(--t3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: 'var(--bg)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keyBudgets.slice(0, 4).map((kb) => {
                  const chip = statusChip(kb.percentage)
                  return (
                    <tr
                      key={kb.keyId}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => { window.location.href = '/dashboard/keys' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                    >
                      <td style={{ padding: '11px 16px', fontSize: 11, fontFamily: 'monospace' }}>
                        {kb.keyName}
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 12 }}>
                        {kb.cap ? fmtCost(kb.cap) : '—'}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              width: 60,
                              height: 5,
                              background: 'var(--border)',
                              borderRadius: 9999,
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                borderRadius: 9999,
                                background: barColor(kb.percentage),
                                width: `${Math.min(kb.percentage, 100)}%`,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 11,
                              color: barColor(kb.percentage),
                            }}
                          >
                            {Math.round(kb.percentage)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: 9999,
                            fontSize: 10,
                            fontWeight: 500,
                            background: chip.bg,
                            color: chip.color,
                          }}
                        >
                          {chip.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Customers mini */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 500 }}>Top Customers — AI Cost</div>
            <Link
              href="/dashboard/customers"
              style={{ fontSize: 12, color: 'var(--pri)', textDecoration: 'none' }}
            >
              Margin Intel →
            </Link>
          </div>
          {customersLoading ? (
            <div style={{ padding: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 28, background: '#F5F5F5', borderRadius: 4, marginBottom: 8 }} />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>
              <div style={{ marginBottom: 8 }}>No customer data yet.</div>
              <div style={{ fontSize: 11 }}>
                Add{' '}
                <code style={{ fontFamily: 'monospace', background: '#F5F5F5', padding: '1px 4px', borderRadius: 3 }}>
                  X-TL-User-Id
                </code>{' '}
                header to your requests.
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Customer', 'AI Cost', 'Requests', 'Avg/Req'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '9px 16px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 500,
                        color: 'var(--t3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: 'var(--bg)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.slice(0, 4).map((c) => (
                  <tr
                    key={c.userIdTag}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => { window.location.href = '/dashboard/customers' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                  >
                    <td style={{ padding: '11px 16px', fontSize: 12, fontFamily: 'monospace' }}>
                      {c.userIdTag}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, fontFamily: 'monospace' }}>
                      {fmtCost(c.totalCost)}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, fontFamily: 'monospace' }}>
                      {c.requestCount.toLocaleString()}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, fontFamily: 'monospace' }}>
                      ${c.avgCostPerReq.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
