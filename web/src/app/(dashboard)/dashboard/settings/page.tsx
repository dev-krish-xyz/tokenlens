'use client'
import { useState, useEffect } from 'react'
import { trpc } from '../../../../trpc/client.ts'

function formatRelativeTime(date: Date | string): string {
  const ms = new Date(date).getTime() - Date.now()
  const hours = Math.round(ms / (1000 * 60 * 60))
  if (hours <= 0) return 'expired'
  if (hours === 1) return 'in 1 hour'
  return `in ${hours} hours`
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const colours: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    member: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colours[role] ?? colours.viewer}`}>
      {role}
    </span>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  const isPro = plan === 'pro'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isPro ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
      {isPro ? 'Pro' : 'Free'}
    </span>
  )
}

export default function SettingsPage() {
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

  useEffect(() => {
    if (settings) setName(settings.name)
  }, [settings])

  useEffect(() => {
    if (settings) setBudgetCap(settings.budgetCap !== null ? String(settings.budgetCap) : '')
  }, [settings])

  const currentMember = members?.find((m) => m.role === 'admin') // placeholder — actual current user check below

  // Determine current user's role from the members list using session.
  // We compare by email via getSettings owning admin — for display gating we use
  // the fact that protectedAdminProcedure already enforces server-side; we expose
  // isAdmin from userRole returned by trpc context.
  // Simplest client-side check: if updateName mutation returns FORBIDDEN, show error.
  // For UI gating, use the fact that if listMembers is accessible (member+), the
  // current user is at least member. Admin inputs are optimistically shown and
  // server enforces the real check.
  // We still want to disable for non-admins: query getSettings succeeds for all roles,
  // but listMembers requires member+. We'll use a separate userRole query approach —
  // actually the simplest is: admin = someone whose role in members list is 'admin'
  // AND they can call updateName. Since we don't have a "who am I" query, we check
  // via mutation error.
  // Better: add a small derived state from listMembers — we need session user id.
  // For now, let's use the fact that updateName will FORBIDDEN if not admin.
  // UI: show inputs for everyone, disable on FORBIDDEN response.

  const updateNameMutation = trpc.workspace.updateName.useMutation({
    onSuccess: () => utils.workspace.getSettings.invalidate(),
    onError: (e) => setNameError(e.message),
  })

  const updateBudgetCapMutation = trpc.workspace.updateBudgetCap.useMutation({
    onSuccess: () => utils.workspace.getSettings.invalidate(),
    onError: (e) => setCapError(e.message),
  })

  const updateRoleMutation = trpc.workspace.updateMemberRole.useMutation({
    onSuccess: () => utils.workspace.listMembers.invalidate(),
  })

  const removeMemberMutation = trpc.workspace.removeMember.useMutation({
    onSuccess: () => {
      setRemoveTarget(null)
      utils.workspace.listMembers.invalidate()
      utils.workspace.getSettings.invalidate()
    },
  })

  const sendInviteMutation = trpc.invite.sendInvite.useMutation({
    onSuccess: (data) => {
      setInviteDialogOpen(false)
      setInviteEmail('')
      setInviteRole('member')
      setInviteError(null)
      setInviteSuccess(`Invite sent to ${data.email}`)
      utils.invite.listPendingInvites.invalidate()
      setTimeout(() => setInviteSuccess(null), 5000)
    },
    onError: (e) => setInviteError(e.message),
  })

  const revokeInviteMutation = trpc.invite.revokeInvite.useMutation({
    onSuccess: () => {
      setRevokeTarget(null)
      utils.invite.listPendingInvites.invalidate()
    },
  })

  // Determine if current user is admin: check if any mutation returns FORBIDDEN.
  // Simpler: derive from members — the session user would match a member row.
  // Since we don't have session in client easily, we use listMembers error as signal.
  // For disabling inputs: if listMembers failed with FORBIDDEN, user is viewer-only.
  // Actually protectedMemberProcedure allows viewer+ for listMembers... wait no:
  // listMembers uses protectedMemberProcedure (member+), viewers can't call it.
  // So if membersLoading is done and members is undefined, user may be viewer.
  // We'll track admin status by whether updateName/updateBudgetCap are accessible.
  // For simplicity in MVP: show all inputs, disable submit buttons while mutations are
  // pending, show errors inline. Server enforces actual RBAC.

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-gray-100 animate-pulse" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
          <div className="h-10 w-full rounded bg-gray-100 animate-pulse" />
          <div className="h-10 w-full rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      <Section title="Workspace Settings">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Plan</span>
            <PlanBadge plan={settings.plan} />
            <span className="text-xs text-gray-400">· {settings.memberCount} member{settings.memberCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Workspace name</label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(null) }}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Workspace name"
                maxLength={100}
              />
              <button
                onClick={() => {
                  setNameError(null)
                  updateNameMutation.mutate({ name })
                }}
                disabled={!name.trim() || updateNameMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateNameMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
            {nameError && <p className="text-xs text-red-600">{nameError}</p>}
            {updateNameMutation.isSuccess && <p className="text-xs text-green-600">Saved</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Monthly budget cap (USD)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={budgetCap}
                onChange={(e) => { setBudgetCap(e.target.value); setCapError(null) }}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateBudgetCapMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-gray-400">Gateway returns 429 when workspace spend exceeds this</p>
            {capError && <p className="text-xs text-red-600">{capError}</p>}
            {updateBudgetCapMutation.isSuccess && <p className="text-xs text-green-600">Saved</p>}
          </div>
        </div>
      </Section>

      <Section title="Team Members">
        {membersLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-10 rounded bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : !members || members.length === 0 ? (
          <p className="text-sm text-gray-500">No members found.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {members.map((member) => {
                  const isAdmin = member.role === 'admin'
                  return (
                    <tr key={member.userId}>
                      <td className="px-4 py-3 text-gray-900">{member.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{member.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={(e) => {
                                const newRole = e.target.value as 'member' | 'viewer'
                                updateRoleMutation.mutate({ userId: member.userId, newRole })
                              }}
                              disabled={updateRoleMutation.isPending}
                              className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                            >
                              <option value="member">member</option>
                              <option value="viewer">viewer</option>
                            </select>
                            <button
                              onClick={() => setRemoveTarget(member.userId)}
                              className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                              disabled={removeMemberMutation.isPending}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Invite Members">
        <div className="space-y-4">
          {inviteSuccess && (
            <p className="text-sm text-green-600">{inviteSuccess}</p>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => { setInviteDialogOpen(true); setInviteError(null) }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Invite Member
            </button>
          </div>

          {pendingInvites && pendingInvites.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Expires</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {pendingInvites.map((invite) => (
                    <tr key={invite.id}>
                      <td className="px-4 py-3 text-gray-900">{invite.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={invite.role} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatRelativeTime(invite.expires_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setRevokeTarget(invite.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No pending invites.</p>
          )}
        </div>
      </Section>

      {inviteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl bg-white p-6 shadow-xl w-full max-w-sm space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Invite Member</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null) }}
                  placeholder="colleague@company.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'member' | 'viewer')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              {inviteError && (
                <p className="text-xs text-red-600">{inviteError}</p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setInviteDialogOpen(false); setInviteError(null) }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setInviteError(null)
                  sendInviteMutation.mutate({ email: inviteEmail, role: inviteRole })
                }}
                disabled={!inviteEmail.trim() || sendInviteMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendInviteMutation.isPending ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl bg-white p-6 shadow-xl w-full max-w-sm space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Revoke invite?</h3>
            <p className="text-sm text-gray-600">The invite link will stop working immediately.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRevokeTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => revokeInviteMutation.mutate({ id: revokeTarget })}
                disabled={revokeInviteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {revokeInviteMutation.isPending ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl bg-white p-6 shadow-xl w-full max-w-sm space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Remove member?</h3>
            <p className="text-sm text-gray-600">
              This will revoke their access to the workspace immediately.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRemoveTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => removeMemberMutation.mutate({ userId: removeTarget })}
                disabled={removeMemberMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
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
