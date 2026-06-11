'use client'
import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '../../../../trpc/client.ts'

const PROVIDER_BADGE: Record<string, string> = {
  openai: 'bg-blue-100 text-blue-800',
  anthropic: 'bg-orange-100 text-orange-800',
  gemini: 'bg-green-100 text-green-800',
}

const THRESHOLD_OPTIONS = [
  { label: '50%', value: 50 },
  { label: '70%', value: 70 },
  { label: '80%', value: 80 },
  { label: '90%', value: 90 },
  { label: '95%', value: 95 },
]

const COOLDOWN_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '24 hours', value: 1440 },
]

function barColor(pct: number): string {
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80) return 'bg-yellow-500'
  return 'bg-green-500'
}

function formatCooldown(min: number | null): string {
  if (!min) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function ProgressBar({
  percentage,
  ariaLabel,
}: {
  percentage: number
  ariaLabel: string
}) {
  const capped = Math.min(percentage, 100)
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(capped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className="w-full bg-gray-100 rounded-full h-2"
    >
      <div
        className={`h-2 rounded-full transition-all ${barColor(percentage)}`}
        style={{ width: `${capped}%` }}
      />
    </div>
  )
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

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading…</div>
  }

  const hasAnyCap = wsBudget !== null || keyBudgets.length > 0

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Budget</h1>

      {/* Workspace budget */}
      {wsBudget ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Workspace Budget</h2>
          {wsBudget.percentage >= 100 && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              Workspace budget exceeded — requests are being blocked
            </div>
          )}
          {wsBudget.percentage >= 80 && wsBudget.percentage < 100 && (
            <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700">
              Approaching workspace limit
            </div>
          )}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">
                ${wsBudget.spend.toFixed(4)} spent of ${wsBudget.cap.toFixed(2)} cap this month
              </span>
              <span className="font-medium text-gray-900">{Math.round(wsBudget.percentage)}%</span>
            </div>
            <ProgressBar
              percentage={wsBudget.percentage}
              ariaLabel={`Workspace budget: ${Math.round(wsBudget.percentage)}% used`}
            />
            <p className="text-xs text-gray-400">${wsBudget.remaining.toFixed(4)} remaining · Resets on the 1st of next month</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
          <p className="text-sm text-gray-500">No workspace budget cap set.</p>
          <Link href="/dashboard/settings" className="text-sm text-indigo-600 hover:underline mt-1 inline-block">
            Set one in Settings →
          </Link>
        </div>
      )}

      {/* Per-key budgets */}
      <div>
        <h2 className="text-sm font-medium text-gray-900 mb-3">Key Budgets</h2>
        {keyBudgets.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {keyBudgets.map((kb) => (
              <div key={kb.keyId} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]" title={kb.keyName}>
                    {kb.keyName.length > 24 ? `${kb.keyName.slice(0, 24)}…` : kb.keyName}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_BADGE[kb.provider] ?? 'bg-gray-100 text-gray-700'}`}
                  >
                    {kb.provider}
                  </span>
                  {kb.percentage >= 100 && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                      BLOCKED
                    </span>
                  )}
                  {kb.percentage >= 80 && kb.percentage < 100 && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700">
                      WARNING
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <ProgressBar
                    percentage={kb.percentage}
                    ariaLabel={`${kb.keyName} budget: ${Math.round(kb.percentage)}% used`}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>${kb.spend.toFixed(4)} / ${kb.cap.toFixed(2)}</span>
                    <span>{Math.round(kb.percentage)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
            <p className="text-sm text-gray-500">No per-key budget caps set.</p>
            <p className="text-xs text-gray-400 mt-1">Create a key with a budget cap to track it here.</p>
            <Link href="/dashboard/keys" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
              Manage Keys →
            </Link>
          </div>
        )}
      </div>

      {!hasAnyCap && (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500 text-sm mb-1">No budget caps configured.</p>
          <p className="text-gray-400 text-sm mb-4">
            Set a budget cap on a virtual key or your workspace to enable spend enforcement.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard/keys"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Manage Keys
            </Link>
            <Link
              href="/dashboard/settings"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Workspace Settings
            </Link>
          </div>
        </div>
      )}

      {/* Alert configuration */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Budget Alerts</h2>
            <p className="text-xs text-gray-500 mt-0.5">Get notified when spend approaches your budget caps.</p>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Add Alert
          </button>
        </div>

        {alertConfigs.length > 0 ? (
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-[1fr_80px_80px_60px_80px] gap-4 px-6 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <span>Channel</span>
              <span>Threshold</span>
              <span>Cooldown</span>
              <span>Active</span>
              <span />
            </div>
            {alertConfigs.map((cfg) => (
              <div key={cfg.id} className="grid grid-cols-[1fr_80px_80px_60px_80px] gap-4 items-center px-6 py-3">
                <span
                  className="text-sm text-gray-700 truncate"
                  title={cfg.channel}
                >
                  {cfg.channel.length > 40 ? `${cfg.channel.slice(0, 40)}…` : cfg.channel}
                </span>
                <span className="text-sm text-gray-600">at {cfg.threshold_pct}%</span>
                <span className="text-sm text-gray-600">{formatCooldown(cfg.cooldown_min)}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={cfg.is_active ?? false}
                    onChange={(e) =>
                      updateAlert.mutate({ id: cfg.id, isActive: e.target.checked })
                    }
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
                <button
                  onClick={() => setDeleteConfirmId(cfg.id)}
                  className="text-xs text-red-500 hover:text-red-700 text-right"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-500">No alerts configured.</p>
            <p className="text-xs text-gray-400 mt-1">Add an alert to get notified before you hit your budget limit.</p>
          </div>
        )}
      </div>

      {/* Add alert dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Add Budget Alert</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel
                </label>
                <input
                  type="text"
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  placeholder="Email or webhook URL"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Email: user@example.com · Webhook: https://…
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert threshold
                </label>
                <select
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {THRESHOLD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cooldown between alerts
                </label>
                <select
                  value={newCooldown}
                  onChange={(e) => setNewCooldown(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {COOLDOWN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddDialog(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createAlert.isPending ? 'Saving…' : 'Add Alert'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete alert?</h3>
            <p className="text-sm text-gray-500 mb-6">This alert config will be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAlert.mutate({ id: deleteConfirmId })
                  setDeleteConfirmId(null)
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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
