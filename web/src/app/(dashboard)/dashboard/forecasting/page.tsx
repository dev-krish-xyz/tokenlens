'use client'
import { useQueryState, parseAsInteger } from 'nuqs'
import { trpc } from '../../../../trpc/client.ts'
import {
  AreaChart, Area, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer,
} from 'recharts'

const DATE_OPTIONS = [{ label: '7d', value: 7 }, { label: '30d', value: 30 }]

function fmtDay(iso: string) {
  const p = iso.split('-').map(Number)
  return new Date((p[0] ?? 2000), (p[1] ?? 1) - 1, p[2] ?? 1)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function KpiCard({ label, value, delta, deltaColor }: { label: string; value: React.ReactNode; delta?: string; deltaColor?: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'monospace', marginBottom: 3 }}>{value}</div>
      {delta && <div style={{ fontSize: 11, color: deltaColor ?? 'var(--t3)' }}>{delta}</div>}
    </div>
  )
}

export default function ForecastingPage() {
  const [days, setDays] = useQueryState('days', parseAsInteger.withDefault(7))

  // Use real spend data for "actual" line
  const { data: daily = [], isLoading } = trpc.cost.getDailySpend.useQuery({ days })
  const { data: topModels = [] } = trpc.cost.getTopModels.useQuery({ days })
  const { data: stats } = trpc.cost.getSummaryStats.useQuery({ days })
  // TODO: trpc.forecasting.getProjection.useQuery({ days }) — ML-based projection endpoint

  // Client-side linear projection from actual data
  const totalActual = daily.reduce((s, d) => s + d.totalCost, 0)
  const dailyAvg = daily.length > 0 ? totalActual / daily.length : 0
  const daysInMonth = 30
  const projected = dailyAvg * daysInMonth
  const burnRate = dailyAvg
  const maxModelCost = Math.max(...topModels.map((m) => m.totalCost), 1)

  // Build chart data: actual + forecast extension
  const today = new Date()
  const chartData = [
    ...daily.map((d) => ({ day: d.day, actual: d.totalCost, forecast: undefined as number | undefined })),
    // Add forecast dots for next 7 days
    ...Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() + i + 1)
      const iso = d.toISOString().slice(0, 10)
      return { day: iso, actual: undefined as number | undefined, forecast: dailyAvg }
    }),
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Forecasting</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Spend projections based on current burn rate</div>
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

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Actual Spend" value={`$${totalActual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} delta={`last ${days} days`} deltaColor="var(--t3)" />
        <KpiCard label="Projected MTD" value={`$${projected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} delta="at current burn rate" deltaColor="var(--warn)" />
        <KpiCard label="Burn Rate" value={`$${burnRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day`} delta="→ daily average" deltaColor="var(--t3)" />
        <KpiCard
          label="30-Day Forecast"
          value={`$${(burnRate * 30).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          // TODO: trpc.forecasting.getProjection.useQuery() for ML-based 30-day forecast
          delta="linear projection"
          deltaColor="var(--t3)"
        />
      </div>

      {/* Forecast chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>30-Day Spend Forecast</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 24, height: 2, background: 'var(--pri)', display: 'inline-block' }} />Actual
            </span>
            <span style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 24, height: 2, background: 'var(--pri)', display: 'inline-block', opacity: 0.5, borderBottom: '2px dashed' }} />Forecast
            </span>
          </div>
        </div>
        {isLoading ? (
          <div style={{ height: 160, background: '#F5F5F5', borderRadius: 8 }} />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5A4EC7" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#5A4EC7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fontSize: 9, fill: '#787585' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: unknown) => [`$${typeof v === 'number' ? v.toFixed(4) : v}`, '']}
                labelFormatter={(l: unknown) => typeof l === 'string' ? fmtDay(l) : String(l)}
              />
              {stats?.totalCost != null && stats.totalCost > 0 && (
                <ReferenceLine y={stats.totalCost * 2} stroke="#BA1A1A" strokeDasharray="4 3" label={{ value: 'Budget', fill: '#BA1A1A', fontSize: 9 }} />
              )}
              <Area type="monotone" dataKey="actual" stroke="#5A4EC7" strokeWidth={2} fill="url(#fg)" dot={false} connectNulls={false} />
              <Area type="monotone" dataKey="forecast" stroke="#5A4EC7" strokeWidth={1.5} strokeDasharray="5 4" fill="none" dot={false} connectNulls={false} opacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8, textAlign: 'center' }}>
          {/* TODO: trpc.forecasting.getProjection.useQuery() — replace linear projection with ML model */}
          Linear projection based on last {days} days · ML forecasting coming soon
        </div>
      </div>

      {/* Model forecast */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Model Cost Forecast (30d linear)</div>
        {topModels.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: '20px 0' }}>No model data yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topModels.slice(0, 5).map((m) => {
              const projected30 = m.totalCost * (30 / days)
              const pct = (m.totalCost / maxModelCost) * 100
              return (
                <div key={m.model}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{m.model}</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--warn)' }}>${projected30.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} projected</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 9999, background: 'var(--pri)', width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
