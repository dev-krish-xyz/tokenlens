// TODO: trpc.gateway.getHealth.useQuery() — replace static data when gateway health router is built

const MIDDLEWARE = [
  { n: 1, name: 'requestId', avg: '0.1ms', status: 'ok' },
  { n: 2, name: 'rateLimiter', avg: '0.4ms', status: 'ok' },
  { n: 3, name: 'requestValidator', avg: '0.2ms', status: 'ok' },
  { n: 4, name: 'virtualKeyResolver', avg: '0.8ms', status: 'ok' },
  { n: 5, name: 'freeTierEnforcer', avg: '1.2ms', status: 'ok' },
  { n: 6, name: 'budgetEnforcer', avg: '1.1ms', status: 'warn' },
  { n: 7, name: 'providerProxy', avg: '310ms', status: 'ok' },
  { n: 8, name: 'logAsync', avg: 'async', status: 'ok' },
]

function KpiCard({ label, value, delta, deltaColor }: { label: string; value: React.ReactNode; delta?: string; deltaColor?: string }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: '#0D0D0D', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6 }}>{value}</div>
      {delta && <div style={{ fontSize: 11, color: deltaColor ?? '#9CA3AF' }}>{delta}</div>}
    </div>
  )
}

export default function HealthPage() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Gateway Health</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Middleware pipeline performance and system status</div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Gateway Status" value={<span style={{ color: '#10B981', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Operational</span>} delta="99.98% uptime · 30d" />
        <KpiCard label="p50 Latency" value="312ms" delta="→ Normal" />
        <KpiCard label="p99 Latency" value="1,840ms" delta="→ Normal" />
        <KpiCard label="Error Rate" value="0.8%" delta="↓ Healthy" deltaColor="var(--ok)" />
      </div>

      {/* Pipeline diagram */}
      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 18 }}>Middleware Pipeline — {MIDDLEWARE.length}-Step Chain</div>
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 0 }}>
          {MIDDLEWARE.map((m, i) => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                  background: m.status === 'warn' ? '#FEF9C3' : '#F0F0F0',
                  border: `1.5px solid ${m.status === 'warn' ? '#F59E0B' : '#E0E0E0'}`,
                  color: m.status === 'warn' ? '#F59E0B' : '#6B7280',
                }}>
                  {m.n}
                </div>
                <div style={{ fontSize: 10, textAlign: 'center', marginTop: 6, color: 'var(--t2)', fontWeight: 500, maxWidth: 80 }}>{m.name}</div>
                <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2, fontFamily: 'monospace' }}>{m.avg}</div>
              </div>
              {i < MIDDLEWARE.length - 1 && (
                <div style={{ height: 2, width: 20, background: 'var(--border)', flexShrink: 0, marginBottom: 20 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Uptime history */}
      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Uptime History (last 30 days)</div>
        <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const ok = i !== 12 && i !== 24
            return <div key={i} style={{ flex: 1, height: 24, borderRadius: 3, background: ok ? '#D1FAE5' : '#FECACA' }} title={ok ? 'Operational' : 'Incident'} />
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)' }}>
          <span>30 days ago</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#16A34A', borderRadius: 2, display: 'inline-block' }} />Operational</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#BA1A1A', borderRadius: 2, display: 'inline-block' }} />Incident</span>
          </span>
          <span>Today</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 10 }}>
          {/* TODO: trpc.gateway.getHealth.useQuery() — replace with real uptime data */}
          Static placeholder data · Real gateway health metrics coming when health router is built
        </div>
      </div>
    </div>
  )
}
