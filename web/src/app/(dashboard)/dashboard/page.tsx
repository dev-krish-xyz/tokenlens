'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useQueryState, parseAsInteger } from 'nuqs'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { trpc } from '../../../trpc/client.ts'

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
  if (pct >= 100) return '#EF4444'
  if (pct >= 80) return '#F59E0B'
  return '#10B981'
}
function statusText(pct: number): { label: string; color: string } {
  if (pct >= 100) return { label: 'Blocked', color: '#EF4444' }
  if (pct >= 80) return { label: 'Warning', color: '#F59E0B' }
  return { label: 'Active', color: '#10B981' }
}

// ─── sub-components ─────────────────────────────────────────
function KpiCard({ label, value, sub, subColor }: { label: string; value: React.ReactNode; sub?: string; subColor?: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: '#0D0D0D', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: subColor ?? '#9CA3AF', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ height: 10, width: 60, background: '#EFEFEF', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ height: 28, width: 90, background: '#EFEFEF', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 10, width: 70, background: '#EFEFEF', borderRadius: 4 }} />
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
    <div style={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      <div style={{ color: '#9CA3AF', marginBottom: 3 }}>{fmtDay(row.payload.day)}</div>
      <div style={{ fontWeight: 600, color: '#0D0D0D' }}>{fmtCost(row.value)}</div>
      <div style={{ color: '#9CA3AF', marginTop: 2 }}>{row.payload.requestCount.toLocaleString()} reqs</div>
    </div>
  )
}

const DATE_OPTIONS = [{ label: '7d', value: 7 }, { label: '30d', value: 30 }, { label: '90d', value: 90 }]

// ─── DEMO DATA — remove when real data flows ────────────────
const DEMO_DAILY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date('2026-06-12')
  d.setDate(d.getDate() - (29 - i))
  const trend = 14 + i * 0.48
  const wave = Math.sin(i * 0.71) * 4.2 + Math.cos(i * 1.3) * 2.1
  return { day: d.toISOString().slice(0, 10), totalCost: parseFloat(Math.max(trend + wave, 4).toFixed(4)), requestCount: Math.round((trend + wave) * 39) }
})
const DEMO_TOP_MODELS = [
  { model: 'gpt-4o', provider: 'openai', totalCost: 420.12, requestCount: 1840 },
  { model: 'claude-3-5-sonnet-20241022', provider: 'anthropic', totalCost: 310.88, requestCount: 920 },
  { model: 'gpt-4o-mini', provider: 'openai', totalCost: 180.44, requestCount: 4200 },
  { model: 'claude-3-haiku-20240307', provider: 'anthropic', totalCost: 95.30, requestCount: 2100 },
  { model: 'gemini-1.5-pro', provider: 'gemini', totalCost: 67.18, requestCount: 560 },
]
const DEMO_KEY_BUDGETS = [
  { keyId: 'demo-1', keyName: 'prod-chat', spend: 371.40, cap: 500, percentage: 74.28, remaining: 128.60 },
  { keyId: 'demo-2', keyName: 'staging', spend: 46.80, cap: 200, percentage: 23.40, remaining: 153.20 },
  { keyId: 'demo-3', keyName: 'analytics-pipeline', spend: 136.50, cap: 150, percentage: 91.00, remaining: 13.50 },
]
const DEMO_CUSTOMERS = [
  { userIdTag: 'user_acme_001', totalCost: 312.44, requestCount: 1840, avgCostPerReq: 0.1698, avgLatencyMs: 298, topModel: 'gpt-4o' },
  { userIdTag: 'user_beta_corp', totalCost: 198.22, requestCount: 920, avgCostPerReq: 0.2155, avgLatencyMs: 842, topModel: 'claude-3-5-sonnet' },
  { userIdTag: 'user_dev_3a9f', totalCost: 87.10, requestCount: 440, avgCostPerReq: 0.1980, avgLatencyMs: 315, topModel: 'gpt-4o-mini' },
  { userIdTag: 'user_anon_7b2c', totalCost: 45.08, requestCount: 280, avgCostPerReq: 0.1610, avgLatencyMs: 267, topModel: 'gemini-1.5-pro' },
]
const DEMO_STATS = { totalCost: 1072.44, totalRequests: 9620, avgLatencyMs: 318, uniqueModels: 5 }
// ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [days, setDays] = useQueryState('days', parseAsInteger.withDefault(7))
  const [alertDismissed, setAlertDismissed] = useState(false)

  const { data: stats, isLoading: statsLoading } = trpc.cost.getSummaryStats.useQuery({ days })
  const { data: dailySpend = [], isLoading: chartLoading } = trpc.cost.getDailySpend.useQuery({ days })
  const { data: topModels = [] } = trpc.cost.getTopModels.useQuery({ days })
  const { data: keyBudgets = [] } = trpc.budget.getKeyBudgetStatus.useQuery()
  const { data: customers = [] } = trpc.cost.getPerCustomerCost.useQuery({ days })

  const displayStats = (!statsLoading && !stats) ? DEMO_STATS : stats
  const displayDaily = (!chartLoading && dailySpend.length === 0) ? DEMO_DAILY.slice(-days) : dailySpend
  const displayModels = topModels.length === 0 && !statsLoading ? DEMO_TOP_MODELS : topModels
  const displayBudgets = keyBudgets.length === 0 ? DEMO_KEY_BUDGETS : keyBudgets
  const displayCustomers = customers.length === 0 ? DEMO_CUSTOMERS : customers

  const warningKeys = displayBudgets.filter((kb) => kb.percentage >= 80 && kb.percentage < 100)
  const blockedKeys = displayBudgets.filter((kb) => kb.percentage >= 100)
  const alertKey = blockedKeys[0] ?? warningKeys[0]

  const maxModelCost = Math.max(...displayModels.map((m) => m.totalCost), 1)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 17, fontWeight: 600, color: '#0D0D0D', letterSpacing: '-0.02em' }}>Overview</h1>
          {keyBudgets.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#10B981', fontWeight: 500 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              {keyBudgets.length} active
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Date range */}
          <div style={{ display: 'flex', gap: 1, background: '#F0F0F0', borderRadius: 8, padding: 3 }}>
            {DATE_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => void setDays(opt.value)}
                style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none', background: days === opt.value ? '#FFFFFF' : 'transparent', color: days === opt.value ? '#0D0D0D' : '#9CA3AF', boxShadow: days === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.1s' }}>
                {opt.label}
              </button>
            ))}
          </div>

          <Link href="/dashboard/keys"
            style={{ padding: '6px 14px', borderRadius: 8, background: '#0D0D0D', color: '#FFFFFF', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
            + Create key
          </Link>
        </div>
      </div>

      {/* Alert banner — minimal */}
      {alertKey && !alertDismissed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, marginBottom: 24, fontSize: 12 }}>
          <span style={{ color: '#D97706', fontSize: 14 }}>⚠</span>
          <span style={{ color: '#92400E', flex: 1 }}>
            <code style={{ fontFamily: 'monospace', fontSize: 11 }}>{alertKey.keyName}</code> is at {Math.round(alertKey.percentage)}% of ${alertKey.cap?.toFixed(0)} budget
          </span>
          <Link href="/dashboard/budget" style={{ fontSize: 11, color: '#D97706', fontWeight: 500, textDecoration: 'none' }}>View →</Link>
          <button onClick={() => setAlertDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D97706', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>
      )}

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 24 }}>
        {statsLoading
          ? Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)
          : <>
            <KpiCard label="MTD Spend" value={fmtCost(displayStats?.totalCost ?? 0)} sub="total cost" />
            <KpiCard label="Requests" value={(displayStats?.totalRequests ?? 0).toLocaleString()} sub={`last ${days} days`} />
            <KpiCard label="Avg Latency" value={`${Math.round(displayStats?.avgLatencyMs ?? 0)}ms`} sub="p50 median" />
            <KpiCard label="Models" value={displayStats?.uniqueModels ?? 0} sub="unique models used" />
            <KpiCard
              label="Budget Health"
              value={blockedKeys.length > 0 ? `${blockedKeys.length} blocked` : warningKeys.length > 0 ? `${warningKeys.length} at risk` : 'Healthy'}
              sub={blockedKeys.length > 0 ? 'keys exceeded cap' : warningKeys.length > 0 ? '≥80% of cap' : 'all within budget'}
              subColor={blockedKeys.length > 0 ? '#EF4444' : warningKeys.length > 0 ? '#F59E0B' : '#10B981'}
            />
          </>
        }
      </div>

      {/* Chart + Model breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 24 }}>
        {/* Spend chart */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#0D0D0D' }}>Daily Spend</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>last {days} days</div>
          </div>
          {chartLoading ? (
            <div style={{ height: 140, background: '#F4F4F5', borderRadius: 8 }} />
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={displayDaily} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#F0F0F2" vertical={false} />
                <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="totalCost" stroke="#6366F1" strokeWidth={2} fill="url(#sg)" dot={false} activeDot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By Model */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '20px' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#0D0D0D', marginBottom: 20 }}>By Model</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {displayModels.slice(0, 5).map((m) => {
              const pct = (m.totalCost / maxModelCost) * 100
              return (
                <div key={m.model}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11 }}>
                    <span style={{ color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{m.model}</span>
                    <span style={{ color: '#0D0D0D', fontWeight: 500 }}>{fmtCost(m.totalCost)}</span>
                  </div>
                  <div style={{ height: 3, background: '#EBEBEB', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 9999, background: '#6366F1', width: `${pct}%`, opacity: 0.7 + (pct / 300) }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Virtual keys */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#0D0D0D' }}>Virtual Keys</div>
            <Link href="/dashboard/keys" style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'none' }}>View all</Link>
          </div>

          <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {displayBudgets.slice(0, 4).map((kb) => {
                const status = statusText(kb.percentage)
                return (
                  <div key={kb.keyId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{kb.keyName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: status.color, fontWeight: 500 }}>{status.label}</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>{Math.round(kb.percentage)}%</span>
                      </div>
                    </div>
                    <div style={{ height: 3, background: '#EBEBEB', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 9999, background: barColor(kb.percentage), width: `${Math.min(kb.percentage, 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
        </div>

        {/* Top customers */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#0D0D0D' }}>Top Customers</div>
            <Link href="/dashboard/customers" style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'none' }}>View all</Link>
          </div>

          <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayCustomers.slice(0, 4).map((c) => (
              <div key={c.userIdTag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{c.userIdTag}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{c.requestCount.toLocaleString()} reqs</span>
                  <span style={{ fontSize: 11, color: '#0D0D0D', fontWeight: 500 }}>{fmtCost(c.totalCost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
