'use client'
import Link from 'next/link'
import { trpc } from '../../trpc/client.ts'

type Props = { days: number }

function Card({ title, value, label }: { title: string; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{label}</p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
      <div className="mt-2 h-8 w-32 rounded bg-gray-100 animate-pulse" />
      <div className="mt-1 h-3 w-20 rounded bg-gray-100 animate-pulse" />
    </div>
  )
}

export function SummaryCards({ days }: Props) {
  const { data, isLoading } = trpc.cost.getSummaryStats.useQuery({ days })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const stats = data ?? { totalCost: 0, totalRequests: 0, avgLatencyMs: 0, uniqueModels: 0 }
  const isEmpty = stats.totalRequests === 0

  return (
    <div className="space-y-4">
      {isEmpty && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          No requests yet. Route your first request through the gateway to see cost data here.{' '}
          <Link href="/dashboard/keys" className="font-medium underline underline-offset-2">
            Create an API key
          </Link>{' '}
          to get started.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card
          title="Total Spend"
          value={`$${stats.totalCost.toFixed(4)}`}
          label={`Last ${days} days`}
        />
        <Card
          title="Total Requests"
          value={stats.totalRequests.toLocaleString()}
          label={`Last ${days} days`}
        />
        <Card
          title="Avg Latency"
          value={`${Math.round(stats.avgLatencyMs)}ms`}
          label="Per request"
        />
        <Card
          title="Models Used"
          value={stats.uniqueModels}
          label="Unique models"
        />
      </div>
    </div>
  )
}
