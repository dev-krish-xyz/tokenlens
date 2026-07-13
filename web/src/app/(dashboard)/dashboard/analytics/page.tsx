'use client'
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs'
import { trpc } from '../../../../trpc/client.ts'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

const DATE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
]

const TABS = [
  { id: 'usage', label: 'Usage' },
  { id: 'logs', label: 'Request Logs' },
  { id: 'traces', label: 'Traces', badge: 'New' },
]

const TH: React.CSSProperties = {
  padding: '9px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 400,
  color: 'var(--t3)',
  background: 'var(--bg)',
  borderBottom: '1px solid var(--border)',
}

function fmtDay(iso: string) {
  const p = iso.split('-').map(Number)
  return new Date((p[0] ?? 2000), (p[1] ?? 1) - 1, p[2] ?? 1)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function KpiCard({ label, value, delta, deltaColor }: { label: string; value: React.ReactNode; delta?: string; deltaColor?: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: '#0D0D0D', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6 }}>{value}</div>
      {delta && <div style={{ fontSize: 11, color: deltaColor ?? '#9CA3AF' }}>{delta}</div>}
    </div>
  )
}

// Static example traces for Traces tab stub
const EXAMPLE_TRACES = [
  {
    id: 'trace_8Kp9mRx2',
    status: 'OK',
    duration: '1,240ms',
    cost: '$0.024',
    spans: [
      { name: 'budgetCheck', ms: 2, total: 1240, color: '#16A34A' },
      { name: 'providerCall', ms: 1238, total: 1240, color: '#5A4EC7' },
    ],
  },
  {
    id: 'trace_3Lq7nBz8',
    status: 'BLOCKED',
    duration: '2ms',
    cost: '$0.000',
    spans: [
      { name: 'budgetCheck', ms: 2, total: 2, color: '#BA1A1A' },
    ],
  },
  {
    id: 'trace_9Mx4pKz1',
    status: 'OK',
    duration: '891ms',
    cost: '$0.057',
    spans: [
      { name: 'budgetCheck', ms: 1, total: 891, color: '#16A34A' },
      { name: 'keyResolver', ms: 3, total: 891, color: '#5A4EC7' },
      { name: 'providerCall', ms: 887, total: 891, color: '#7C6ED4' },
    ],
  },
]

// ─── DEMO DATA — remove when real data flows ────────────────
const DEMO_DAILY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date('2026-06-12')
  d.setDate(d.getDate() - (29 - i))
  const trend = 14 + i * 0.48
  const wave = Math.sin(i * 0.71) * 4.2 + Math.cos(i * 1.3) * 2.1
  const totalCost = parseFloat(Math.max(trend + wave, 4).toFixed(4))
  return { day: d.toISOString().slice(0, 10), totalCost, requestCount: Math.round(totalCost * 39) }
})
const DEMO_TOP_MODELS = [
  { model: 'gpt-4o', provider: 'openai', totalCost: 420.12, requestCount: 1840 },
  { model: 'claude-3-5-sonnet-20241022', provider: 'anthropic', totalCost: 310.88, requestCount: 920 },
  { model: 'gpt-4o-mini', provider: 'openai', totalCost: 180.44, requestCount: 4200 },
  { model: 'claude-3-haiku-20240307', provider: 'anthropic', totalCost: 95.30, requestCount: 2100 },
  { model: 'gemini-1.5-pro', provider: 'gemini', totalCost: 67.18, requestCount: 560 },
]
const DEMO_STATS = { totalCost: 1072.44, totalRequests: 9620, avgLatencyMs: 318, uniqueModels: 5 }
// ────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [days, setDays] = useQueryState('days', parseAsInteger.withDefault(7))
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('usage'))

  const { data: stats, isLoading: statsLoading } = trpc.cost.getSummaryStats.useQuery({ days })
  const { data: daily = [], isLoading: dailyLoading } = trpc.cost.getDailySpend.useQuery({ days })
  const { data: topModels = [] } = trpc.cost.getTopModels.useQuery({ days })

  const displayStats = (!statsLoading && !stats) ? DEMO_STATS : stats
  const displayDaily = (!dailyLoading && daily.length === 0) ? DEMO_DAILY.slice(-days) : daily
  const displayModels = topModels.length === 0 && !statsLoading ? DEMO_TOP_MODELS : topModels

  const maxReqs = Math.max(...displayDaily.map((d) => d.requestCount), 1)

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Analytics</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Usage · Logs · Traces</div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--border)', borderRadius: 10, padding: 4 }}>
          {DATE_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => void setDays(opt.value)}
              style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: days === opt.value ? 'var(--surface)' : 'transparent', color: days === opt.value ? 'var(--t1)' : 'var(--t3)', boxShadow: days === opt.value ? '0 1px 4px rgba(0,0,0,.08)' : 'none' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--border)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 20 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => void setTab(t.id)}
            style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: tab === t.id ? 'var(--surface)' : 'transparent', color: tab === t.id ? 'var(--t1)' : 'var(--t3)', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            {t.label}
            {t.badge && <span style={{ fontSize: 10, color: '#C4C4C4', fontWeight: 400 }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── Usage tab ── */}
      {tab === 'usage' && (
        <div>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
            {statsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '16px 20px', height: 88 }} />
              ))
            ) : (
              <>
                <KpiCard label="Total Requests" value={(displayStats?.totalRequests ?? 0).toLocaleString()} delta={`last ${days} days`} deltaColor="var(--ok)" />
                <KpiCard label="Total Tokens" value="—" delta="coming soon" deltaColor="var(--t3)" />
                <KpiCard label="Total Spend" value={`$${(displayStats?.totalCost ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} delta="this period" deltaColor="var(--t3)" />
                <KpiCard label="Avg Latency" value={`${Math.round(displayStats?.avgLatencyMs ?? 0)}ms`} delta="p50 median" deltaColor="var(--t3)" />
                <KpiCard
                  label="Error Rate"
                  // TODO: trpc.cost.getSummaryStats needs errorRate field (count of 4xx/5xx / total)
                  value="—"
                  delta="TODO: add to getSummaryStats"
                  deltaColor="var(--t3)"
                />
              </>
            )}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Requests per day bar chart */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Requests per Day</div>
              {dailyLoading ? (
                <div style={{ height: 130, background: '#F5F5F5', borderRadius: 8 }} />
              ) : (
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={displayDaily} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fontSize: 9, fill: '#787585' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: unknown) => [typeof v === 'number' ? v.toLocaleString() : String(v), 'Requests']}
                      labelFormatter={(label: unknown) => typeof label === 'string' ? fmtDay(label) : String(label)}
                    />
                    <Bar dataKey="requestCount" fill="#C7D2FE" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Token Mix */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Token Mix</div>
              {/* TODO: trpc.cost.getTokenBreakdown.useQuery({ days }) — needs new ClickHouse query for input/output/cache token split */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {[
                  { label: 'Input tokens', val: '—', pct: 65, color: '#6366F1' },
                  { label: 'Output tokens', val: '—', pct: 30, color: '#A5B4FC' },
                  { label: 'Cache read', val: '—', pct: 5, color: '#E0E7FF' },
                ].map((row) => (
                  <div key={row.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span>{row.label}</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--t3)' }}>{row.val}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 9999, background: row.color, width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--t3)' }}>
                {/* TODO: trpc.cost.getCacheStats.useQuery() */}
                Cache hit rate: <strong style={{ color: 'var(--t1)' }}>—</strong>
              </div>
            </div>
          </div>

          {/* Top Models table */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Top Models</div>
              <span style={{ fontSize: 12, color: 'var(--t3)' }}>last {days} days</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Model', 'Provider', 'Requests', 'Total Spend', 'Spend Share'].map((h) => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayModels.map((m) => {
                    const maxCost = Math.max(...displayModels.map((x) => x.totalCost), 1)
                    return (
                      <tr key={m.model} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)' }} onMouseLeave={(e) => { e.currentTarget.style.background = '' }}>
                        <td style={{ padding: '11px 16px', fontSize: 11, fontFamily: 'monospace', borderBottom: '1px solid var(--border)' }}>{m.model}</td>
                        <td style={{ padding: '11px 16px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 400 }}>{m.provider}</span>
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: 12, fontFamily: 'monospace', borderBottom: '1px solid var(--border)' }}>{m.requestCount.toLocaleString()}</td>
                        <td style={{ padding: '11px 16px', fontSize: 12, fontFamily: 'monospace', borderBottom: '1px solid var(--border)' }}>${m.totalCost.toFixed(4)}</td>
                        <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', minWidth: 120 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 9999, background: 'var(--pri)', width: `${(m.totalCost / maxCost) * 100}%` }} />
                            </div>
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--t3)' }}>
                              {Math.round((m.totalCost / displayModels.reduce((s, x) => s + x.totalCost, 0)) * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
          </div>
        </div>
      )}

      {/* ── Request Logs redirect notice ── */}
      {tab === 'logs' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Request Logs are in their own page</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 20 }}>Full filtering, pagination, and export available there.</div>
          <a href="/dashboard/logs" style={{ padding: '9px 24px', borderRadius: 8, background: 'var(--pri)', color: '#fff', fontSize: 12, fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}>
            Go to Request Logs →
          </a>
        </div>
      )}

      {/* ── Traces tab ── */}
      {tab === 'traces' && (
        <div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Traces</div>
              <span style={{ fontSize: 11, color: '#C4C4C4', fontWeight: 400 }}>Beta</span>
            </div>
            {/* TODO: trpc.traces.list.useQuery({ days }) — when traces router is built, replace static data below */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {EXAMPLE_TRACES.map((trace) => (
                <div key={trace.id} style={{ background: 'var(--surface)', border: '1px solid #E4E4E7', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500 }}>{trace.id}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 500,
                        color: trace.status === 'OK' ? '#10B981' : '#EF4444',
                      }}>
                        {trace.status}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'monospace' }}>
                      {trace.duration} · {trace.cost} · {trace.spans.length} span{trace.spans.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {trace.spans.map((span) => {
                      const pct = Math.max((span.ms / span.total) * 100, 2)
                      return (
                        <div key={span.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 100, fontSize: 11, color: 'var(--t3)', flexShrink: 0 }}>{span.name}</div>
                          <div style={{ flex: 1, height: 6, background: '#EDE9FF', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: span.color }} />
                          </div>
                          <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--t3)', width: 48, textAlign: 'right' }}>
                            {span.name === 'budgetCheck' && trace.status === 'BLOCKED' ? '429' : `${span.ms}ms`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>
                Showing example traces · {/* TODO: trpc.traces.list.useQuery() */}real data coming soon
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
