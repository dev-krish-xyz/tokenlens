'use client'
import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '../../../../trpc/client.ts'
import { IconBell, IconPlus, IconX, IconTrendingUp, IconShieldCheck } from '@tabler/icons-react'

const THRESHOLD_OPTIONS = [50, 70, 80, 90, 95]
const COOLDOWN_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '24 hours', value: 1440 },
]

function formatCooldown(min: number | null): string {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function barColor(pct: number): string {
  if (pct >= 100) return 'var(--err)'
  if (pct >= 80) return 'var(--warn)'
  return 'var(--ok)'
}

function statusChip(pct: number): { label: string; bg: string; color: string } {
  if (pct >= 100) return { label: 'Blocked', bg: '#FEF2F2', color: '#BA1A1A' }
  if (pct >= 80) return { label: 'Warning', bg: '#FEF3C7', color: '#D97706' }
  return { label: 'Active', bg: '#DCFCE7', color: '#16A34A' }
}

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

export default function BudgetPage() {
  const utils = trpc.useUtils()
  const { data: wsBudget, isLoading: wsLoading } = trpc.budget.getWorkspaceBudgetStatus.useQuery()
  const { data: keyBudgets = [], isLoading: keyLoading } = trpc.budget.getKeyBudgetStatus.useQuery()
  const { data: alertConfigs = [], isLoading: alertLoading } = trpc.alertConfig.listAlertConfigs.useQuery()

  const createAlert = trpc.alertConfig.createAlertConfig.useMutation({
    onSuccess: () => {
      void utils.alertConfig.listAlertConfigs.invalidate()
      setShowAddDialog(false)
      setNewChannel('')
      setNewThreshold(80)
      setNewCooldown(60)
    },
  })

  const updateAlert = trpc.alertConfig.updateAlertConfig.useMutation({
    onSuccess: () => void utils.alertConfig.listAlertConfigs.invalidate(),
  })

  const deleteAlert = trpc.alertConfig.deleteAlertConfig.useMutation({
    onSuccess: () => void utils.alertConfig.listAlertConfigs.invalidate(),
  })

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newChannel, setNewChannel] = useState('')
  const [newThreshold, setNewThreshold] = useState(80)
  const [newCooldown, setNewCooldown] = useState(60)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const isLoading = wsLoading || keyLoading || alertLoading

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Budget & Alerts
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
          Spend enforcement and notification rules
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '18px',
                height: 120,
              }}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Workspace budget */}
          {wsBudget ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 18,
                marginBottom: 16,
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
                <div style={{ fontSize: 13, fontWeight: 500 }}>Workspace Budget</div>
                <Link
                  href="/dashboard/settings"
                  style={{ fontSize: 12, color: 'var(--pri)', textDecoration: 'none' }}
                >
                  Edit cap →
                </Link>
              </div>

              {wsBudget.percentage >= 100 && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    fontSize: 12,
                    color: 'var(--err)',
                    marginBottom: 14,
                  }}
                >
                  Workspace budget exceeded — requests are being blocked
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ fontFamily: 'monospace' }}>
                    ${wsBudget.spend.toFixed(4)} / ${wsBudget.cap.toFixed(2)} cap
                  </span>
                  <span style={{ fontWeight: 600, color: barColor(wsBudget.percentage) }}>
                    {Math.round(wsBudget.percentage)}%
                  </span>
                </div>
                <div
                  style={{
                    height: 10,
                    background: 'var(--border)',
                    borderRadius: 9999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 9999,
                      background: barColor(wsBudget.percentage),
                      width: `${Math.min(wsBudget.percentage, 100)}%`,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: 'var(--t3)',
                    fontFamily: 'monospace',
                  }}
                >
                  <span>${wsBudget.spend.toFixed(4)} used</span>
                  <span>${wsBudget.remaining.toFixed(4)} remaining</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px dashed var(--border)',
                borderRadius: 14,
                padding: '24px 20px',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>
                No workspace budget cap set.
              </div>
              <Link
                href="/dashboard/settings"
                style={{ fontSize: 12, color: 'var(--pri)', textDecoration: 'none' }}
              >
                Set one in Settings →
              </Link>
            </div>
          )}

          {/* Per-key budgets */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              overflow: 'hidden',
              marginBottom: 16,
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
              <div style={{ fontSize: 13, fontWeight: 500 }}>Key Budgets</div>
              <Link
                href="/dashboard/keys"
                style={{ fontSize: 12, color: 'var(--pri)', textDecoration: 'none' }}
              >
                Manage Keys →
              </Link>
            </div>

            {keyBudgets.length === 0 ? (
              <div
                style={{
                  padding: '32px 20px',
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
                    background: '#FFF7ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <IconShieldCheck size={22} color="var(--warn)" />
                </div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>No Budget Caps</div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--t3)',
                    maxWidth: 220,
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}
                >
                  Create a virtual key with a monthly budget cap to track spend here.
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
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 18 }}>
                {keyBudgets.map((kb) => {
                  const chip = statusChip(kb.percentage)
                  return (
                    <div
                      key={kb.keyId}
                      style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '14px 16px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                          title={kb.keyName}
                        >
                          {kb.keyName.length > 20 ? `${kb.keyName.slice(0, 20)}…` : kb.keyName}
                        </span>
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
                            flexShrink: 0,
                          }}
                        >
                          {chip.label}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: 'var(--border)',
                          borderRadius: 9999,
                          overflow: 'hidden',
                          marginBottom: 8,
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
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 11,
                          color: 'var(--t3)',
                          fontFamily: 'monospace',
                        }}
                      >
                        <span>${kb.spend.toFixed(4)} / ${kb.cap.toFixed(2)}</span>
                        <span style={{ color: barColor(kb.percentage), fontWeight: 600 }}>
                          {Math.round(kb.percentage)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Alert Rules */}
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
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Alert Rules</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                  Get notified before budgets are exceeded
                </div>
              </div>
              <button
                onClick={() => setShowAddDialog(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'var(--pri)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <IconPlus size={13} />
                New Alert Rule
              </button>
            </div>

            {alertConfigs.length === 0 ? (
              <div
                style={{
                  padding: '32px 20px',
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
                    background: '#FEF2F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <IconBell size={22} color="var(--err)" />
                </div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>No Alert Rules</div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--t3)',
                    maxWidth: 220,
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}
                >
                  Get notified before budgets are exceeded — not after the bill arrives.
                </div>
                <button
                  onClick={() => setShowAddDialog(true)}
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
                  + New Alert Rule
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 18 }}>
                {alertConfigs.map((cfg) => {
                  const borderColor =
                    cfg.threshold_pct >= 100
                      ? 'var(--err)'
                      : cfg.threshold_pct >= 80
                        ? 'var(--warn)'
                        : 'var(--pri)'
                  return (
                    <div
                      key={cfg.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderLeft: `3px solid ${borderColor}`,
                        borderRadius: 14,
                        padding: '14px 16px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 13 }}>
                            Budget Alert — {cfg.threshold_pct}%
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                            {cfg.channel} · cooldown {formatCooldown(cfg.cooldown_min)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Toggle */}
                          <label
                            style={{
                              position: 'relative',
                              display: 'inline-block',
                              width: 40,
                              height: 22,
                              flexShrink: 0,
                            }}
                          >
                            <input
                              type="checkbox"
                              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                              checked={cfg.is_active ?? false}
                              onChange={(e) =>
                                updateAlert.mutate({ id: cfg.id, isActive: e.target.checked })
                              }
                            />
                            <span
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: cfg.is_active ? 'var(--pri)' : 'var(--border)',
                                borderRadius: 9999,
                                cursor: 'pointer',
                                transition: '0.15s',
                              }}
                            >
                              <span
                                style={{
                                  position: 'absolute',
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  background: '#fff',
                                  top: 3,
                                  left: cfg.is_active ? 21 : 3,
                                  transition: '0.15s',
                                  boxShadow: '0 1px 3px rgba(0,0,0,.15)',
                                }}
                              />
                            </span>
                          </label>
                          <button
                            onClick={() => setDeleteConfirmId(cfg.id)}
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
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Alert slide-over */}
      {showAddDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28,27,34,0.35)',
            zIndex: 400,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setShowAddDialog(false)}
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600 }}>New Alert Rule</div>
              <button
                onClick={() => setShowAddDialog(false)}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
              {createAlert.error && (
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
                  {createAlert.error.message}
                </div>
              )}
              <div>
                <label style={labelStyle}>Channel (email or webhook URL)</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="user@example.com or https://…"
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                />
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>
                  Email: user@example.com · Webhook: https://…
                </div>
              </div>
              <div>
                <label style={labelStyle}>Alert threshold</label>
                <select
                  style={{ ...inputStyle, background: 'var(--surface)', cursor: 'pointer' }}
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(Number(e.target.value))}
                >
                  {THRESHOLD_OPTIONS.map((pct) => (
                    <option key={pct} value={pct}>
                      {pct}% of budget
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Cooldown between alerts</label>
                <select
                  style={{ ...inputStyle, background: 'var(--surface)', cursor: 'pointer' }}
                  value={newCooldown}
                  onChange={(e) => setNewCooldown(Number(e.target.value))}
                >
                  {COOLDOWN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button
                  onClick={() => setShowAddDialog(false)}
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
                  onClick={() =>
                    createAlert.mutate({
                      channel: newChannel,
                      thresholdPct: newThreshold,
                      cooldownMin: newCooldown,
                    })
                  }
                  disabled={!newChannel.trim() || createAlert.isPending}
                  style={{
                    flex: 2,
                    padding: '9px 14px',
                    borderRadius: 8,
                    background: 'var(--pri)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 500,
                    border: 'none',
                    cursor: !newChannel.trim() || createAlert.isPending ? 'not-allowed' : 'pointer',
                    opacity: !newChannel.trim() || createAlert.isPending ? 0.6 : 1,
                  }}
                >
                  {createAlert.isPending ? 'Saving…' : 'Create Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirmId && (
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
          onClick={() => setDeleteConfirmId(null)}
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
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Delete alert?</div>
            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 20 }}>
              This alert config will be permanently removed.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
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
                onClick={() => {
                  deleteAlert.mutate({ id: deleteConfirmId })
                  setDeleteConfirmId(null)
                }}
                style={{
                  flex: 2,
                  padding: '9px 14px',
                  borderRadius: 8,
                  background: 'var(--err)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
