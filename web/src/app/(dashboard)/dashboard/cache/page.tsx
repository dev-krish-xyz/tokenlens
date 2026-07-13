'use client'
import { useState } from 'react'

// TODO: trpc.cache.getStats.useQuery() — replace static data when cache router is built
// TODO: trpc.cache.updateStrategy.useMutation() — wire toggles when router is built

function KpiCard({ label, value, delta, deltaColor }: { label: string; value: React.ReactNode; delta?: string; deltaColor?: string }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: '#0D0D0D', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6 }}>{value}</div>
      {delta && <div style={{ fontSize: 11, color: deltaColor ?? '#9CA3AF' }}>{delta}</div>}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, flexShrink: 0 }}>
      <input type="checkbox" style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span style={{ position: 'absolute', inset: 0, background: checked ? 'var(--pri)' : 'var(--border)', borderRadius: 9999, cursor: 'pointer', transition: '0.15s' }}>
        <span style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: '#fff', top: 3, left: checked ? 21 : 3, transition: '0.15s', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />
      </span>
    </label>
  )
}

export default function CachePage() {
  const [semanticCache, setSemanticCache] = useState(true)
  const [exactCache, setExactCache] = useState(true)
  const [ttl] = useState('24h')

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Cache</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>DragonflyDB cache stats and strategy configuration</div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Cache Hit Rate" value="18.4%" delta="↑ 3pp WoW" deltaColor="var(--ok)" />
        <KpiCard label="Tokens Saved" value="2.2M" delta="This month" />
        <KpiCard label="Cost Saved" value="$47" delta="From cache hits" deltaColor="var(--ok)" />
        <KpiCard label="DragonflyDB" value={<span style={{ color: '#10B981', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Connected</span>} delta="12.4MB used" />
      </div>

      {/* Cache key registry */}
      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Cache Key Registry</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'vk:{virtualKeyId}', desc: 'Resolved key context', ttl: '300s' },
            { key: 'spend:key:{YYYYMM}:{virtualKeyId}', desc: 'Monthly spend counter', ttl: '35d' },
            { key: 'spend:ws:{YYYYMM}:{workspaceId}', desc: 'Workspace monthly spend', ttl: '35d' },
            { key: 'wscap:{workspaceId}', desc: 'Workspace budget cap', ttl: '300s' },
            { key: 'plan:{workspaceId}', desc: 'Plan tier cache', ttl: '300s' },
            { key: 'alert:sent:{virtualKeyId}:{YYYYMMDDHH}', desc: 'Dedup flag', ttl: '1h' },
            { key: 'rl:{ip}:{minute}', desc: 'Rate limit window', ttl: '60s' },
          ].map((row) => (
            <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}>
              <code style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--pri)', flex: 1 }}>{row.key}</code>
              <span style={{ fontSize: 11, color: 'var(--t3)', flex: 1 }}>{row.desc}</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9CA3AF', flexShrink: 0 }}>TTL {row.ttl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cache Strategy */}
      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Cache Strategy</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Semantic Cache</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                Cosine similarity ≥ 0.92 → return cached response
                {/* TODO: trpc.cache.updateStrategy.useMutation({ semanticCache: v }) */}
              </div>
            </div>
            <Toggle checked={semanticCache} onChange={setSemanticCache} />
          </div>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Exact Cache</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                Hash-identical prompts → instant return
                {/* TODO: trpc.cache.updateStrategy.useMutation({ exactCache: v }) */}
              </div>
            </div>
            <Toggle checked={exactCache} onChange={setExactCache} />
          </div>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>TTL</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>Cache expiry period</div>
            </div>
            <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 500 }}>{ttl}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
