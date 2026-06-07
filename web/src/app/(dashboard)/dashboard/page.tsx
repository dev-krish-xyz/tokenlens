'use client'
import { useDateRange } from '../../../features/cost-dashboard/useDateRange.ts'
import { SummaryCards } from '../../../features/cost-dashboard/SummaryCards.tsx'
import { DailySpendChart } from '../../../features/cost-dashboard/DailySpendChart.tsx'
import { TopModelsTable } from '../../../features/cost-dashboard/TopModelsTable.tsx'

const DATE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
] as const

export default function DashboardPage() {
  const { days, setDays } = useDateRange()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => void setDays(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                days === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <SummaryCards days={days} />
      <DailySpendChart days={days} />
      <TopModelsTable days={days} />
    </div>
  )
}
