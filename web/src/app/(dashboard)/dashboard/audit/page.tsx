'use client'
import { useState } from 'react'

// TODO: trpc.audit.list.useQuery({ limit, offset, search }) — replace when audit log router is built
const EXAMPLE_EVENTS = [
  { time: '14:22:01', actor: 'Krishna Patel', action: 'key.created', resource: 'tl-vk-Lq8n···', ip: '203.0.113.4', actionType: 'create' },
  { time: '13:45:12', actor: 'Aria Singh', action: 'guardrail.updated', resource: 'Prod Daily Cap', ip: '198.51.100.2', actionType: 'update' },
  { time: '11:30:08', actor: 'Krishna Patel', action: 'member.invited', resource: 'dev@company.ai', ip: '203.0.113.4', actionType: 'create' },
  { time: '09:14:53', actor: 'System', action: 'budget.blocked', resource: 'tl-vk-dev-local', ip: '—', actionType: 'block' },
  { time: 'Yesterday', actor: 'Krishna Patel', action: 'provider.added', resource: 'Anthropic', ip: '203.0.113.4', actionType: 'create' },
  { time: 'Yesterday', actor: 'Aria Singh', action: 'workspace.settings_updated', resource: 'Acme Corp', ip: '198.51.100.2', actionType: 'update' },
  { time: '2 days ago', actor: 'System', action: 'alert.fired', resource: 'Budget 80% — tl-vk-prod-chat', ip: '—', actionType: 'system' },
]

const ACTION_CHIP: Record<string, { bg: string; color: string }> = {
  create: { bg: '#DCFCE7', color: '#16A34A' },
  update: { bg: '#EDE9FF', color: '#5A4EC7' },
  block: { bg: '#FEF2F2', color: '#BA1A1A' },
  system: { bg: '#F4F4F5', color: '#474553' },
}

const TH: React.CSSProperties = {
  padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 500,
  color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em',
  background: 'var(--bg)', borderBottom: '1px solid var(--border)',
}

export default function AuditPage() {
  const [search, setSearch] = useState('')

  const filtered = EXAMPLE_EVENTS.filter((e) =>
    !search || e.actor.toLowerCase().includes(search.toLowerCase()) ||
    e.action.includes(search.toLowerCase()) || e.resource.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Audit Log</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>All team actions — immutable record</div>
        </div>
        <button
          onClick={() => { /* TODO: export audit log as CSV */ }}
          style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, color: 'var(--t2)', cursor: 'pointer' }}>
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Recent Activity</div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter events…"
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, background: 'var(--surface)', color: 'var(--t1)', outline: 'none', fontFamily: 'monospace', width: 220 }}
          />
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>
            No audit events match your filter.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Time', 'Actor', 'Action', 'Resource', 'IP'].map((h) => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev, i) => {
                const chip = ACTION_CHIP[ev.actionType] ?? ACTION_CHIP.system!
                return (
                  <tr key={i} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)' }} onMouseLeave={(e) => { e.currentTarget.style.background = '' }}>
                    <td style={{ padding: '11px 16px', fontSize: 11, fontFamily: 'monospace', color: 'var(--t3)', borderBottom: '1px solid var(--border)' }}>{ev.time}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>{ev.actor}</td>
                    <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 500, background: chip.bg, color: chip.color }}>{ev.action}</span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 11, fontFamily: 'monospace', borderBottom: '1px solid var(--border)' }}>{ev.resource}</td>
                    <td style={{ padding: '11px 16px', fontSize: 11, fontFamily: 'monospace', color: 'var(--t3)', borderBottom: '1px solid var(--border)' }}>{ev.ip}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--t3)' }}>
          {/* TODO: trpc.audit.list.useQuery({ limit: 50, offset }) — replace static data with real audit log */}
          Showing example events · Real audit log available when audit router is built
        </div>
      </div>
    </div>
  )
}
