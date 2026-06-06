'use client'
import { useState } from 'react'
import { trpc } from '../../../../trpc/client.ts'

type Provider = 'openai' | 'anthropic' | 'gemini'

const PROVIDER_BADGE: Record<string, string> = {
  openai: 'bg-blue-100 text-blue-800',
  anthropic: 'bg-orange-100 text-orange-800',
  gemini: 'bg-green-100 text-green-800',
}

function formatBudget(cap: string | null): string {
  if (!cap) return 'No limit'
  return `$${Number(cap).toFixed(2)} / mo`
}

function formatDate(d: Date | string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

  // Modal state
  const [showCreate, setShowCreate] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [revealId, setRevealId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Form state
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
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Virtual keys for your developers. Real provider keys are never exposed.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Create Key
        </button>
      </div>

      {/* Keys table */}
      {isLoading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <p className="text-gray-500 text-sm mb-4">No API keys yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Create Key
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Provider</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Budget Cap</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{key.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_BADGE[key.provider] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {key.provider}
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${key.budget_cap ? 'text-gray-600' : 'text-gray-400'}`}>
                    {formatBudget(key.budget_cap)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(key.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteId(key.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Create API Key</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-6">
              {createMutation.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {createMutation.error.message}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Production OpenAI Key"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as Provider)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Gemini</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">API Key</label>
                <input
                  required
                  type="password"
                  value={realApiKey}
                  onChange={(e) => setRealApiKey(e.target.value)}
                  placeholder="Paste your provider API key"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Budget Cap{' '}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={budgetCap}
                  onChange={(e) => setBudgetCap(e.target.value)}
                  placeholder="50.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Monthly spend limit in USD. Leave blank for no limit.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelCreate}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reveal modal */}
      {showReveal && revealId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Your virtual key has been created.
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Your virtual key ID</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-900">
                  {revealId}
                </code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <p className="text-sm font-semibold text-amber-700">
              Save this key. It will not be shown again.
            </p>
            <button
              onClick={closeReveal}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Delete key?</h2>
            <p className="text-sm text-gray-500">
              This will permanently deactivate this key. Requests using it will fail immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: deleteId })}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
