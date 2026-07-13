'use client'
import { useState } from 'react'
import { IconShieldLock, IconPlus, IconX } from '@tabler/icons-react'

// TODO: replace with trpc.guardrails.list.useQuery() when router is built
type Guardrail = {
  id: string
  name: string
  description: string
  type: 'Budget Hard' | 'Budget Soft' | 'Rate Limit' | 'Content' | 'Model'
  scope: string
  triggered: string
  active: boolean
}

const EXAMPLE_GUARDRAILS: Guardrail[] = [
  { id: '1', name: 'Prod Daily Cap', description: 'Hard block at $80/day', type: 'Budget Hard', scope: 'tl-vk-prod-chat', triggered: '3 today', active: true },
  { id: '2', name: 'GPT-4o Rate Limit', description: 'Max 100 req/min', type: 'Rate Limit', scope: 'All keys', triggered: '0 today', active: true },
  { id: '3', name: 'PII Filter', description: 'Block SSN / CC patterns in prompt', type: 'Content', scope: 'All keys', triggered: '14 total', active: true },
  { id: '4', name: 'Model Allowlist', description: 'Only gpt-4o, claude-3-opus', type: 'Model', scope: 'tl-vk-staging', triggered: '2 today', active: false },
]

const TYPE_CHIP: Record<string, { color: string }> = {
  'Budget Hard': { color: '#EF4444' },
  'Budget Soft': { color: '#F59E0B' },
  'Rate Limit': { color: '#F59E0B' },
  'Content': { color: '#6366F1' },
  'Model': { color: '#6B7280' },
}

const TH: React.CSSProperties = {
  padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 400,
  color: 'var(--t3)',
  background: 'var(--bg)', borderBottom: '1px solid var(--border)',
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--bg)', color: 'var(--t1)', outline: 'none', fontFamily: 'inherit' }

export default function GuardrailsPage() {
  const [guardrails, setGuardrails] = useState<Guardrail[]>(EXAMPLE_GUARDRAILS)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<Guardrail['type']>('Budget Hard')
  const [newLimit, setNewLimit] = useState('')
  const [newPeriod, setNewPeriod] = useState('Monthly')
  const [newScope, setNewScope] = useState('All keys')

  function handleCreate() {
    // TODO: trpc.guardrails.create.useMutation() — replace local state with real mutation
    const newG: Guardrail = {
      id: String(Date.now()),
      name: newName || 'New Guardrail',
      description: `${newType} at ${newLimit ? '$' + newLimit : '—'}/${newPeriod.toLowerCase()}`,
      type: newType,
      scope: newScope,
      triggered: '0 today',
      active: true,
    }
    setGuardrails([...guardrails, newG])
    setShowCreate(false)
    setNewName(''); setNewLimit('')
  }

  function toggleActive(id: string) {
    // TODO: trpc.guardrails.update.useMutation({ id, isActive })
    setGuardrails(guardrails.map((g) => g.id === id ? { ...g, active: !g.active } : g))
  }

  function deleteGuardrail(id: string) {
    // TODO: trpc.guardrails.delete.useMutation({ id })
    setGuardrails(guardrails.filter((g) => g.id !== id))
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Guardrails</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Budget limits, rate rules, content filters, model allowlists</div>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: 'var(--pri)', color: '#fff', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
          <IconPlus size={14} />
          New Guardrail
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Active Guardrails</div>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>{guardrails.length} rules</span>
        </div>

        {guardrails.length === 0 ? (
          <div style={{ padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <IconShieldLock size={22} color="var(--warn)" />
            </div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No Guardrails Active</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 220, lineHeight: 1.6, marginBottom: 16 }}>Set budget limits and content rules to protect against runaway AI costs.</div>
            <button onClick={() => setShowCreate(true)}
              style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--warn)', color: '#fff', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              + Create Guardrail
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'Type', 'Scope', 'Triggered', 'Status', ''].map((h) => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guardrails.map((g) => {
                const chip = TYPE_CHIP[g.type] ?? TYPE_CHIP['Model']!
                return (
                  <tr key={g.id} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)' }} onMouseLeave={(e) => { e.currentTarget.style.background = '' }}>
                    <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{g.description}</div>
                    </td>
                    <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 11, color: chip.color, fontWeight: 500 }}>{g.type}</span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 11, fontFamily: 'monospace', borderBottom: '1px solid var(--border)' }}>{g.scope}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12, fontFamily: 'monospace', borderBottom: '1px solid var(--border)' }}>{g.triggered}</td>
                    <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                      <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, flexShrink: 0 }}>
                        <input type="checkbox" style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} checked={g.active} onChange={() => toggleActive(g.id)} />
                        <span style={{ position: 'absolute', inset: 0, background: g.active ? 'var(--pri)' : 'var(--border)', borderRadius: 9999, cursor: 'pointer', transition: '0.15s' }}>
                          <span style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: '#fff', top: 3, left: g.active ? 21 : 3, transition: '0.15s', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />
                        </span>
                      </label>
                    </td>
                    <td style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                      <button onClick={() => { /* TODO: open edit slide-over */ }} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 11, color: 'var(--t2)', cursor: 'pointer', marginRight: 6 }}>Edit</button>
                      <button onClick={() => deleteGuardrail(g.id)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', fontSize: 11, color: 'var(--err)', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create slide-over */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,27,34,0.35)', zIndex: 400, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setShowCreate(false)}>
          <div style={{ width: 480, height: '100%', background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,.12)', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>New Guardrail</div>
              <button onClick={() => setShowCreate(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)' }}><IconX size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
              <div>
                <label style={labelStyle}>Guardrail Name</label>
                <input style={inputStyle} placeholder="e.g. Prod Daily Cap" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select style={{ ...inputStyle, background: 'var(--surface)', cursor: 'pointer' }} value={newType} onChange={(e) => setNewType(e.target.value as Guardrail['type'])}>
                  <option>Budget Hard</option>
                  <option>Budget Soft</option>
                  <option>Rate Limit</option>
                  <option>Content</option>
                  <option>Model</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Limit Value</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: '#F5F5F5', color: 'var(--t3)' }}>$</span>
                  <input type="number" style={{ ...inputStyle, flex: 1 }} placeholder="100" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Period</label>
                <select style={{ ...inputStyle, background: 'var(--surface)', cursor: 'pointer' }} value={newPeriod} onChange={(e) => setNewPeriod(e.target.value)}>
                  <option>Daily</option><option>Monthly</option><option>Per Request</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Scope</label>
                <select style={{ ...inputStyle, background: 'var(--surface)', cursor: 'pointer' }} value={newScope} onChange={(e) => setNewScope(e.target.value)}>
                  <option>All keys</option><option>prod-chat</option><option>prod-embed</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, color: 'var(--t2)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreate} style={{ flex: 2, padding: '9px 14px', borderRadius: 8, background: 'var(--pri)', color: '#fff', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}>Create Guardrail</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
