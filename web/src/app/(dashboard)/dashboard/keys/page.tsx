'use client'
import { useState } from 'react'
import { trpc } from '../../../../trpc/client.ts'
import { IconKey, IconX, IconCopy, IconCheck, IconPlus } from '@tabler/icons-react'

type Provider = 'openai' | 'anthropic' | 'gemini'

function fmtBudget(cap: string | null): string {
  if (!cap) return 'No limit'
  return `$${Number(cap).toFixed(2)}/mo`
}

function fmtDate(d: Date | string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── shared styles ───────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--t2)',
  display: 'block',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 13,
  background: 'var(--bg)',
  color: 'var(--t1)',
  outline: 'none',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: 'var(--surface)',
  cursor: 'pointer',
}

function SlideOverlay({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28,27,34,0.35)',
        zIndex: 400,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 480,
          height: '100%',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,.12)',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function SlideHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 20px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        background: 'var(--surface)',
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>{title}</div>
      <button
        onClick={onClose}
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--t2)',
        }}
      >
        <IconX size={16} />
      </button>
    </div>
  )
}

export default function KeysPage() {
  const utils = trpc.useUtils()
  const { data: keys = [], isLoading } = trpc.virtualKey.list.useQuery()

  const createMutation = trpc.virtualKey.create.useMutation({
    onSuccess: (newKey) => {
      setShowCreate(false)
      setRevealId(newKey.id)
      setShowReveal(true)
      resetForm()
    },
  })

  const deleteMutation = trpc.virtualKey.delete.useMutation({
    onSuccess: () => {
      void utils.virtualKey.list.invalidate()
      setDeleteId(null)
    },
  })

  const [showCreate, setShowCreate] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [revealId, setRevealId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [name, setName] = useState('')
  const [provider, setProvider] = useState<Provider>('openai')
  const [realApiKey, setRealApiKey] = useState('')
  const [budgetCap, setBudgetCap] = useState('')

  function resetForm() {
    setName('')
    setProvider('openai')
    setRealApiKey('')
    setBudgetCap('')
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({
      name,
      provider,
      realApiKey,
      budgetCap: budgetCap !== '' ? Number(budgetCap) : undefined,
    })
  }

  function cancelCreate() {
    setShowCreate(false)
    resetForm()
    createMutation.reset()
  }

  async function handleCopy() {
    if (!revealId) return
    await navigator.clipboard.writeText(revealId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function closeReveal() {
    setShowReveal(false)
    setRevealId(null)
    void utils.virtualKey.list.invalidate()
  }

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
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Virtual Keys</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
            Issue virtual keys to your developers — real provider keys are never exposed
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            borderRadius: 8,
            background: 'var(--pri)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <IconPlus size={14} />
          Create Key
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 32,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 36,
                background: '#F5F5F5',
                borderRadius: 6,
                marginBottom: 10,
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
      ) : keys.length === 0 ? (
        /* Empty state */
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '48px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'var(--pri-m)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <IconKey size={22} color="var(--pri)" />
          </div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No Virtual Keys</div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--t3)',
              maxWidth: 220,
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            Create your first virtual key to start routing AI requests through TokenLens.
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              background: 'var(--pri)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + Create Key
          </button>
        </div>
      ) : (
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
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>{keys.length} keys</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name / Key', 'Provider', 'Budget', 'Created', 'Status', ''].map((h) => (
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
              {keys.map((key) => {
                const providerColors: Record<string, { bg: string; color: string }> = {
                  openai: { bg: '#E0F2FE', color: '#0369A1' },
                  anthropic: { bg: '#FFF7ED', color: '#C2410C' },
                  gemini: { bg: '#F0FDF4', color: '#16A34A' },
                }
                const pc = providerColors[key.provider] ?? { bg: '#F5F5F5', color: 'var(--t2)' }
                return (
                  <tr
                    key={key.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                  >
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{key.name}</div>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 10,
                          color: 'var(--t3)',
                          marginTop: 2,
                        }}
                      >
                        {key.id.slice(0, 8)}···{key.id.slice(-4)}
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
                          background: pc.bg,
                          color: pc.color,
                        }}
                      >
                        {key.provider}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '11px 16px',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: key.budget_cap ? 'var(--t1)' : 'var(--t3)',
                      }}
                    >
                      {fmtBudget(key.budget_cap)}
                    </td>
                    <td
                      style={{
                        padding: '11px 16px',
                        fontSize: 11,
                        color: 'var(--t3)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {fmtDate(key.created_at)}
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
                          background: '#DCFCE7',
                          color: '#16A34A',
                        }}
                      >
                        Active
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setDeleteId(key.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 8,
                          border: '1px solid #FCA5A5',
                          background: '#FEF2F2',
                          fontSize: 11,
                          color: 'var(--err)',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Key slide-over */}
      <SlideOverlay open={showCreate} onClose={cancelCreate}>
        <SlideHeader title="Create Virtual Key" onClose={cancelCreate} />
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
          {createMutation.error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                fontSize: 12,
                color: 'var(--err)',
              }}
            >
              {createMutation.error.message}
            </div>
          )}
          <div>
            <label style={labelStyle}>Key Name</label>
            <input
              required
              style={inputStyle}
              placeholder="e.g. prod-chat"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Provider</label>
            <select
              style={selectStyle}
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Provider API Key</label>
            <input
              required
              type="password"
              style={inputStyle}
              placeholder="Paste your provider API key"
              value={realApiKey}
              onChange={(e) => setRealApiKey(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Monthly Budget{' '}
              <span style={{ fontWeight: 400, color: 'var(--t3)' }}>(optional)</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <span
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  background: '#F5F5F5',
                  color: 'var(--t3)',
                }}
              >
                $
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                style={{ ...inputStyle, flex: 1 }}
                placeholder="500"
                value={budgetCap}
                onChange={(e) => setBudgetCap(e.target.value)}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 5 }}>
              Monthly spend limit in USD. Leave blank for no limit.
            </div>
          </div>
          {/* Key preview */}
          <div
            style={{
              background: 'var(--pri-m)',
              borderRadius: 10,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--pri)', marginBottom: 4 }}>
              Key Preview
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--pri)' }}>
              tl-vk-{'{nanoid}'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
            <button
              type="button"
              onClick={cancelCreate}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: 12,
                color: 'var(--t2)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                flex: 2,
                padding: '9px 14px',
                borderRadius: 8,
                background: 'var(--pri)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: createMutation.isPending ? 0.6 : 1,
              }}
            >
              {createMutation.isPending ? 'Creating…' : 'Create Key'}
            </button>
          </div>
        </form>
      </SlideOverlay>

      {/* Reveal slide-over */}
      <SlideOverlay open={showReveal && !!revealId} onClose={closeReveal}>
        <SlideHeader title="Key Created" onClose={closeReveal} />
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#DCFCE7',
              border: '1px solid #86EFAC',
              fontSize: 12,
              color: '#16A34A',
            }}
          >
            Your virtual key has been created successfully.
          </div>
          <div
            style={{
              background: 'var(--pri-m)',
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--pri)', marginBottom: 4, fontWeight: 500 }}>
              Virtual Key
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 13,
                color: 'var(--pri)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                wordBreak: 'break-all',
              }}
            >
              <span style={{ flex: 1 }}>{revealId}</span>
              <button
                onClick={handleCopy}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: copied ? '#16A34A' : 'var(--pri)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--warn)',
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              padding: '10px 14px',
              borderRadius: 8,
            }}
          >
            Save this key — it will not be shown again.
          </div>
          <button
            onClick={closeReveal}
            style={{
              padding: '9px 14px',
              borderRadius: 8,
              background: 'var(--pri)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Done
          </button>
        </div>
      </SlideOverlay>

      {/* Delete confirm — small modal */}
      {deleteId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28,27,34,0.35)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setDeleteId(null)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 14,
              padding: 24,
              width: '100%',
              maxWidth: 380,
              boxShadow: '0 8px 32px rgba(0,0,0,.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Delete key?</div>
            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 20 }}>
              This will permanently deactivate this key. Requests using it will fail immediately.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: 12,
                  color: 'var(--t2)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: deleteId })}
                disabled={deleteMutation.isPending}
                style={{
                  flex: 2,
                  padding: '9px 14px',
                  borderRadius: 8,
                  background: 'var(--err)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 500,
                  border: 'none',
                  cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: deleteMutation.isPending ? 0.6 : 1,
                }}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
