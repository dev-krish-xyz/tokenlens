'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { trpc } from '../../../../trpc/client.ts'

const MAX_FREE = 50_000

function PlanBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    pro: 'bg-blue-100 text-blue-700',
    enterprise: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold capitalize ${styles[tier] ?? styles.free}`}>
      {tier}
    </span>
  )
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
      {message}
      <button onClick={onDismiss} className="ml-2 text-gray-400 hover:text-white">✕</button>
    </div>
  )
}

export default function BillingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)

  const { data, isLoading } = trpc.billing.getSubscriptionStatus.useQuery()
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) window.location.href = url
    },
    onError: (err) => setToast(`Error: ${err.message}`),
  })

  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    if (success === '1') {
      setToast("You're now on Pro!")
      router.replace('/dashboard/billing')
    } else if (canceled === '1') {
      setToast('Upgrade canceled')
      router.replace('/dashboard/billing')
    }
  }, [searchParams, router])

  if (isLoading || !data) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      </div>
    )
  }

  const usedPct = Math.min(100, (data.requestsUsed / MAX_FREE) * 100)

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your plan and usage</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Current plan</p>
            <div className="mt-1">
              <PlanBadge tier={data.tier} />
            </div>
          </div>
        </div>

        {data.tier === 'free' ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Requests this month</span>
                <span className="font-medium text-gray-900">
                  {data.requestsUsed.toLocaleString()} / {MAX_FREE.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usedPct >= 90 ? 'bg-red-500' : usedPct >= 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              {usedPct >= 90 && (
                <p className="mt-1 text-xs text-red-600">
                  Approaching free tier limit. Upgrade to avoid interruptions.
                </p>
              )}
            </div>

            <button
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {checkoutMutation.isPending ? 'Redirecting to Stripe...' : 'Upgrade to Pro'}
            </button>
            <p className="text-xs text-center text-gray-400">
              Pro plan: unlimited requests, priority support
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-blue-50 px-4 py-3">
            <p className="text-sm font-medium text-blue-800">Pro Plan — Unlimited requests</p>
            <p className="mt-0.5 text-xs text-blue-600">
              You have unrestricted access to the gateway.
            </p>
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
