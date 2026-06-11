'use client'
import { useState, useEffect } from 'react'
import { trpc } from '../../../../trpc/client.ts'
import { IconX, IconPlus, IconUsersGroup } from '@tabler/icons-react'

function formatRelativeTime(date: Date | string): string {
  const ms = new Date(date).getTime() - Date.now()
  const hours = Math.round(ms / (1000 * 60 * 60))
  if (hours <= 0) return 'expired'
  if (hours === 1) return 'in 1 hour'
  return `in ${hours} hours`
}

function initials(name: string | null | undefined, email: string): string {
  if (name) return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS: { bg: string; color: string }[] = [
  { bg: '#EDE9FF', color: '#5A4EC7' },
  { bg: '#F0FDF4', color: '#16A34A' },
  { bg: '#FFF7ED', color: '#D97706' },
  { bg: '#EFF6FF', color: '#0369A1' },
  { bg: '#FEF2F2', color: '#BA1A1A' },
]

function roleChip(role: string): { bg: string; color: string } {
  if (role === 'admin') return { bg: '#EDE9FF', color: '#5A4EC7' }
  if (role === 'member') return { bg: '#E0F2FE', color: '#0369A1' }
  return { bg: '#F4F4F5', color: '#474553' }
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

type Tab = 'general' | 'team' | 'invites'

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general')

  const utils = trpc.useUtils()
  const { data: settings, isLoading: settingsLoading } = trpc.workspace.getSettings.useQuery()
  const { data: members, isLoading: membersLoading } = trpc.workspace.listMembers.useQuery()
  const { data: pendingInvites } = trpc.invite.listPendingInvites.useQuery()

  const [name, setName] = useState('')
  const [budgetCap, setBudgetCap] = useState('')
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [capError, setCapError] = useState<string | null>(null)

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)

  useEffect(() => { if (settings) setName(settings.name) }, [settings])
  useEffect(() => {
    if (settings) setBudgetCap(settings.budgetCap !== null ? String(settings.budgetCap) : '')
  }, [settings])

  const updateNameMutation = trpc.workspace.updateName.useMutation({
    onSuccess: () => void utils.workspace.getSettings.invalidate(),
    onError: (e) => setNameError(e.message),
  })

  const updateBudgetCapMutation = trpc.workspace.updateBudgetCap.useMutation({
    onSuccess: () => void utils.workspace.getSettings.invalidate(),
    onError: (e) => setCapError(e.message),
  })

  const updateRoleMutation = trpc.workspace.updateMemberRole.useMutation({
    onSuccess: () => void utils.workspace.listMembers.invalidate(),
  })

  const removeMemberMutation = trpc.workspace.removeMember.useMutation({
    onSuccess: () => {
      setRemoveTarget(null)
      void utils.workspace.listMembers.invalidate()
      void utils.workspace.getSettings.invalidate()
    },
  })

  const sendInviteMutation = trpc.invite.sendInvite.useMutation({
    onSuccess: (data) => {
      setInviteDialogOpen(false)
      setInviteEmail('')
      setInviteRole('member')
      setInviteError(null)
      setInviteSuccess(`Invite sent to ${data.email}`)
      void utils.invite.listPendingInvites.invalidate()
      setTimeout(() => setInviteSuccess(null), 5000)
    },
    onError: (e) => setInviteError(e.message),
  })

  const revokeInviteMutation = trpc.invite.revokeInvite.useMutation({
    onSuccess: () => {
      setRevokeTarget(null)
      void utils.invite.listPendingInvites.invalidate()
    },
  })

  const TABS: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'team', label: `Team${members ? ` (${members.length})` : ''}` },
    { id: 'invites', label: `Pending Invites${pendingInvites?.length ? ` (${pendingInvites.length})` : ''}` },
  ]

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
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Settings</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
            Workspace config, team members, and invites
          </div>
        </div>
        <button
          onClick={() => { setInviteDialogOpen(true); setInviteError(null) }}
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
          Invite Member
        </button>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: 'var(--border)',
          borderRadius: 10,
          padding: 4,
          width: 'fit-content',
          marginBottom: 20,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: tab === t.id ? 'var(--surface)' : 'transparent',
              color: tab === t.id ? 'var(--t1)' : 'var(--t3)',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              transition: '0.1s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── General tab ── */}
      {tab === 'general' && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 18,
            maxWidth: 600,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {settingsLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 40, background: '#F5F5F5', borderRadius: 8 }} />
              ))}
            </>
          ) : settings ? (
            <>
              {/* Plan */}
              <div>
                <label style={labelStyle}>Plan</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '3px 12px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: settings.plan === 'pro' ? 'var(--pri-m)' : '#F4F4F5',
                      color: settings.plan === 'pro' ? 'var(--pri)' : '#474553',
                      textTransform: 'capitalize',
                    }}
                  >
                    {settings.plan ?? 'Free'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                    · {settings.memberCount} member{settings.memberCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Workspace name */}
              <div>
                <label style={labelStyle}>Organization Name</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setNameError(null) }}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Workspace name"
                    maxLength={100}
                  />
                  <button
                    onClick={() => { setNameError(null); updateNameMutation.mutate({ name }) }}
                    disabled={!name.trim() || updateNameMutation.isPending}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 8,
                      background: 'var(--pri)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 500,
                      border: 'none',
                      cursor: !name.trim() || updateNameMutation.isPending ? 'not-allowed' : 'pointer',
                      opacity: !name.trim() || updateNameMutation.isPending ? 0.6 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {updateNameMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                </div>
                {nameError && (
                  <div style={{ fontSize: 11, color: 'var(--err)', marginTop: 4 }}>{nameError}</div>
                )}
                {updateNameMutation.isSuccess && (
                  <div style={{ fontSize: 11, color: 'var(--ok)', marginTop: 4 }}>Saved ✓</div>
                )}
              </div>

              {/* Budget cap */}
              <div>
                <label style={labelStyle}>Monthly Budget Cap (USD)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span
                    style={{
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      fontSize: 13,
                      background: '#F5F5F5',
                      color: 'var(--t3)',
                      flexShrink: 0,
                    }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetCap}
                    onChange={(e) => { setBudgetCap(e.target.value); setCapError(null) }}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="No limit"
                  />
                  <button
                    onClick={() => {
                      setCapError(null)
                      const parsed = budgetCap === '' ? null : parseFloat(budgetCap)
                      if (parsed !== null && (isNaN(parsed) || parsed <= 0)) {
                        setCapError('Enter a positive number or leave blank for no limit')
                        return
                      }
                      updateBudgetCapMutation.mutate({ budgetCap: parsed })
                    }}
                    disabled={updateBudgetCapMutation.isPending}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 8,
                      background: 'var(--pri)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 500,
                      border: 'none',
                      cursor: updateBudgetCapMutation.isPending ? 'not-allowed' : 'pointer',
                      opacity: updateBudgetCapMutation.isPending ? 0.6 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {updateBudgetCapMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>
                  Gateway returns 429 when workspace spend exceeds this cap
                </div>
                {capError && (
                  <div style={{ fontSize: 11, color: 'var(--err)', marginTop: 4 }}>{capError}</div>
                )}
                {updateBudgetCapMutation.isSuccess && (
                  <div style={{ fontSize: 11, color: 'var(--ok)', marginTop: 4 }}>Saved ✓</div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── Team tab ── */}
      {tab === 'team' && (
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
            <div style={{ fontSize: 13, fontWeight: 500 }}>
              Members ({members?.length ?? 0})
            </div>
          </div>

          {membersLoading ? (
            <div style={{ padding: 16 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{ height: 44, background: '#F5F5F5', borderRadius: 4, marginBottom: 10 }}
                />
              ))}
            </div>
          ) : !members || members.length === 0 ? (
            <div
              style={{
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
                <IconUsersGroup size={22} color="var(--pri)" />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Solo Operator</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 220, lineHeight: 1.6, marginBottom: 16 }}>
                Invite teammates to monitor usage and manage keys with the right roles.
              </div>
              <button
                onClick={() => { setInviteDialogOpen(true); setInviteError(null) }}
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
                + Invite Member
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Member', 'Role', 'Last Active', 'Status', ''].map((h) => (
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
                {members.map((member, i) => {
                  const isAdmin = member.role === 'admin'
                  const av = AVATAR_COLORS[i % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!
                  const chip = roleChip(member.role)
                  return (
                    <tr
                      key={member.userId}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                    >
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: av.bg,
                              color: av.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            {initials(member.name, member.email)}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>
                              {member.name ?? member.email.split('@')[0]}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--t3)' }}>{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        {isAdmin ? (
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
                            {member.role}
                          </span>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) => {
                              const newRole = e.target.value as 'member' | 'viewer'
                              updateRoleMutation.mutate({ userId: member.userId, newRole })
                            }}
                            disabled={updateRoleMutation.isPending}
                            style={{
                              padding: '3px 8px',
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                              fontSize: 11,
                              background: 'var(--surface)',
                              color: 'var(--t2)',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="member">member</option>
                            <option value="viewer">viewer</option>
                          </select>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '11px 16px',
                          fontSize: 11,
                          color: 'var(--t3)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {new Date(member.joinedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
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
                        {isAdmin ? (
                          <span style={{ fontSize: 11, color: 'var(--t3)' }}>—</span>
                        ) : (
                          <button
                            onClick={() => setRemoveTarget(member.userId)}
                            disabled={removeMemberMutation.isPending}
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
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Invites tab ── */}
      {tab === 'invites' && (
        <div>
          {inviteSuccess && (
            <div
              style={{
                padding: '11px 16px',
                borderRadius: 10,
                background: '#DCFCE7',
                border: '1px solid #86EFAC',
                fontSize: 12,
                color: '#16A34A',
                marginBottom: 16,
              }}
            >
              {inviteSuccess}
            </div>
          )}

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
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                Pending Invites ({pendingInvites?.length ?? 0})
              </div>
              <button
                onClick={() => { setInviteDialogOpen(true); setInviteError(null) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
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
                Invite Member
              </button>
            </div>

            {!pendingInvites || pendingInvites.length === 0 ? (
              <div
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  fontSize: 12,
                  color: 'var(--t3)',
                }}
              >
                No pending invites.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Email', 'Role', 'Expires', ''].map((h) => (
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
                  {pendingInvites.map((invite) => {
                    const chip = roleChip(invite.role)
                    return (
                      <tr
                        key={invite.id}
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
                      >
                        <td style={{ padding: '11px 16px', fontSize: 12 }}>{invite.email}</td>
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
                            {invite.role}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            fontSize: 11,
                            color: 'var(--t3)',
                          }}
                        >
                          {invite.expires_at ? formatRelativeTime(invite.expires_at) : '—'}
                        </td>
                        <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => setRevokeTarget(invite.id)}
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
                            Revoke
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Invite slide-over ── */}
      {inviteDialogOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28,27,34,0.35)',
            zIndex: 400,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setInviteDialogOpen(false)}
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
              <div style={{ fontSize: 15, fontWeight: 600 }}>Invite Team Member</div>
              <button
                onClick={() => setInviteDialogOpen(false)}
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
              {inviteError && (
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
                  {inviteError}
                </div>
              )}
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  style={inputStyle}
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null) }}
                />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select
                  style={{ ...inputStyle, background: 'var(--surface)', cursor: 'pointer' }}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'member' | 'viewer')}
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button
                  onClick={() => setInviteDialogOpen(false)}
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
                    setInviteError(null)
                    sendInviteMutation.mutate({ email: inviteEmail, role: inviteRole })
                  }}
                  disabled={!inviteEmail.trim() || sendInviteMutation.isPending}
                  style={{
                    flex: 2,
                    padding: '9px 14px',
                    borderRadius: 8,
                    background: 'var(--pri)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 500,
                    border: 'none',
                    cursor: !inviteEmail.trim() || sendInviteMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: !inviteEmail.trim() || sendInviteMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {sendInviteMutation.isPending ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke confirm */}
      {revokeTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28,27,34,0.35)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setRevokeTarget(null)}
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
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Revoke invite?</div>
            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 20 }}>
              The invite link will stop working immediately.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setRevokeTarget(null)}
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
                onClick={() => revokeInviteMutation.mutate({ id: revokeTarget })}
                disabled={revokeInviteMutation.isPending}
                style={{
                  flex: 2,
                  padding: '9px 14px',
                  borderRadius: 8,
                  background: 'var(--err)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 500,
                  border: 'none',
                  cursor: revokeInviteMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: revokeInviteMutation.isPending ? 0.6 : 1,
                }}
              >
                {revokeInviteMutation.isPending ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove member confirm */}
      {removeTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28,27,34,0.35)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setRemoveTarget(null)}
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
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Remove member?</div>
            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 20 }}>
              This will revoke their access to the workspace immediately.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setRemoveTarget(null)}
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
                onClick={() => removeMemberMutation.mutate({ userId: removeTarget })}
                disabled={removeMemberMutation.isPending}
                style={{
                  flex: 2,
                  padding: '9px 14px',
                  borderRadius: 8,
                  background: 'var(--err)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 500,
                  border: 'none',
                  cursor: removeMemberMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: removeMemberMutation.isPending ? 0.6 : 1,
                }}
              >
                {removeMemberMutation.isPending ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
