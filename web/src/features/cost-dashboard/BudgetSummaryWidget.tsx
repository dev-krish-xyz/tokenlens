'use client'
import Link from 'next/link'
import { trpc } from '../../trpc/client.ts'

const DOT_COLOR: (pct: number) => string = (pct) => {
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80) return 'bg-yellow-500'
  return 'bg-green-500'
}

export function BudgetSummaryWidget() {
  const { data: keyBudgets = [], isLoading } = trpc.budget.getKeyBudgetStatus.useQuery()

  if (isLoading) return null

  const nearCap = keyBudgets.filter((kb) => kb.percentage >= 70)
  if (nearCap.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Budget Alerts</h2>
        <Link
          href="/dashboard/budget"
          className="text-xs text-indigo-600 hover:underline"
        >
          View all budgets →
        </Link>
      </div>
      <ul className="space-y-2">
        {nearCap.map((kb) => (
          <li key={kb.keyId} className="flex items-center gap-2.5 text-sm text-gray-700">
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${DOT_COLOR(kb.percentage)}`} />
            <span className="truncate flex-1">{kb.keyName}</span>
            <span className="text-gray-500 flex-shrink-0">{Math.round(kb.percentage)}% of cap used</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
