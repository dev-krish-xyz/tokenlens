'use client'
import Link from 'next/link'
import { trpc } from '../../../../trpc/client.ts'

const PROVIDER_BADGE: Record<string, string> = {
  openai: 'bg-blue-100 text-blue-800',
  anthropic: 'bg-orange-100 text-orange-800',
  gemini: 'bg-green-100 text-green-800',
}

function ProgressBar({
  percentage,
  label,
  sublabel,
}: {
  percentage: number
  label: string
  sublabel: string
}) {
  const pct = Math.min(percentage, 100)
  const barColor =
    pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">{sublabel}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function BudgetPage() {
  const { data: wsBudget, isLoading: wsLoading } =
    trpc.budget.getWorkspaceBudgetStatus.useQuery()
  const { data: keyBudgets = [], isLoading: keyLoading } =
    trpc.budget.getKeyBudgetStatus.useQuery()

  const isLoading = wsLoading || keyLoading

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading…</div>
  }

  const hasAnyCap = (wsBudget ?? null) !== null || keyBudgets.length > 0

  if (!hasAnyCap) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Budget</h1>
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <p className="text-gray-500 text-sm mb-2">No budget caps configured.</p>
          <p className="text-gray-400 text-sm mb-6">
            Set a budget cap on a virtual key or your workspace to enable spend
            enforcement.
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
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Budget</h1>

      {wsBudget && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Workspace Budget</h2>
          <ProgressBar
            percentage={wsBudget.percentage}
            label={`$${wsBudget.spend.toFixed(4)} spent of $${wsBudget.cap.toFixed(2)} cap this month`}
            sublabel={`$${wsBudget.remaining.toFixed(4)} remaining`}
          />
        </div>
      )}

      {keyBudgets.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          <div className="px-6 py-4">
            <h2 className="text-sm font-medium text-gray-900">Key Budgets</h2>
          </div>
          {keyBudgets.map((kb) => (
            <div key={kb.keyId} className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-900">{kb.keyName}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_BADGE[kb.provider] ?? 'bg-gray-100 text-gray-700'}`}
                >
                  {kb.provider}
                </span>
              </div>
              <ProgressBar
                percentage={kb.percentage}
                label={`$${kb.spend.toFixed(4)} spent of $${kb.cap.toFixed(2)} cap this month`}
                sublabel={`$${kb.remaining.toFixed(4)} remaining`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
