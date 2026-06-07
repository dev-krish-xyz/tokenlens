'use client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { trpc } from '../../trpc/client.ts'

type Props = { days: number }

type DayRow = { day: string; totalCost: number; requestCount: number }

type TooltipPayload = {
  active?: boolean
  payload?: Array<{ value: number; payload: DayRow }>
  label?: string
}

function formatDay(isoDay: string): string {
  const parts = isoDay.split('-').map(Number)
  const year = parts[0] ?? 2000
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function CustomTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null
  const row = payload[0]
  if (!row) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm text-sm">
      <p className="font-medium text-gray-700">{formatDay(row.payload.day)}</p>
      <p className="text-gray-900">${row.value.toFixed(4)}</p>
      <p className="text-gray-500">{row.payload.requestCount.toLocaleString()} requests</p>
    </div>
  )
}

export function DailySpendChart({ days }: Props) {
  const { data, isLoading } = trpc.cost.getDailySpend.useQuery({ days })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm font-medium text-gray-500 mb-4">Daily Spend</p>
        <div className="h-[300px] rounded bg-gray-100 animate-pulse" />
      </div>
    )
  }

  const rows = data ?? []

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-sm font-medium text-gray-500 mb-4">Daily Spend</p>
      {rows.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
          No spend data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="day"
              tickFormatter={formatDay}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `$${v.toFixed(4)}`}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="totalCost"
              stroke="#4f46e5"
              strokeWidth={2}
              fill="url(#spendFill)"
              dot={false}
              activeDot={{ r: 4, fill: '#4f46e5' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
