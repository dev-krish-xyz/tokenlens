'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { trpc } from '../../../../trpc/client.ts'
import { IconX, IconCheck } from '@tabler/icons-react'

const MAX_FREE = 50_000

function barColor(pct: number): string {
  if (pct >= 90) return 'var(--err)'
  if (pct >= 70) return 'var(--warn)'
  return 'var(--pri)'
}

export default function BillingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const { data, isLoading } = trpc.billing.getSubscriptionStatus.useQuery()
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) window.location.href = url
    },
    onError: (err) => {
      setToastType('error')
      setToast(`Error: ${err.message}`)
    },
  })

  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    if (success === '1') {
      setToastType('success')
      setToast("You're now on Pro!")
      router.replace('/dashboard/billing')
    } else if (canceled === '1') {
      setToastType('error')
      setToast('Upgrade canceled')
      router.replace('/dashboard/billing')
    }
  }, [searchParams, router])

  const usedPct = data ? Math.min(100, (data.requestsUsed / MAX_FREE) * 100) : 0

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Billing</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
          Manage your plan and request usage
        </div>
      </div>

      {isLoading || !data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: i === 1 ? 80 : 200,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
              }}
            />
          ))}
        </div>
      ) : (
        <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Plan card */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500, marginBottom: 8 }}>
                  Current plan
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 14px',
                    borderRadius: 9999,
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    background:
                      data.tier === 'pro'
                        ? 'var(--pri-m)'
                        : data.tier === 'enterprise'
                          ? '#F5F3FF'
                          : '#F4F4F5',
                    color:
                      data.tier === 'pro'
                        ? 'var(--pri)'
                        : data.tier === 'enterprise'
                          ? '#6D28D9'
                          : 'var(--t2)',
                    textTransform: 'capitalize',
                  }}
                >
                  {data.tier === 'free' ? 'Starter' : data.tier === 'pro' ? 'Pro' : 'Enterprise'}
                </div>
              </div>
              {data.tier !== 'free' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 9999,
                    background: '#DCFCE7',
                    color: '#16A34A',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  <IconCheck size={14} />
                  Active
                </div>
              )}
            </div>

            {data.tier === 'free' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Request usage */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ color: 'var(--t2)' }}>Requests this month</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 500, color: 'var(--t1)' }}>
                      {data.requestsUsed.toLocaleString()} / {MAX_FREE.toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: 'var(--border)',
                      borderRadius: 9999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 9999,
                        background: barColor(usedPct),
                        width: `${usedPct}%`,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  {usedPct >= 90 && (
                    <div style={{ fontSize: 11, color: 'var(--err)', marginTop: 4 }}>
                      Approaching free tier limit. Upgrade to avoid interruptions.
                    </div>
                  )}
                </div>

                {/* Upgrade CTA */}
                <button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  style={{
                    width: '100%',
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: 'var(--pri)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    border: 'none',
                    cursor: checkoutMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: checkoutMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {checkoutMutation.isPending ? 'Redirecting to Stripe…' : 'Upgrade to Pro'}
                </button>

                <div style={{ fontSize: 11, textAlign: 'center', color: 'var(--t3)' }}>
                  Pro plan: $49/mo · Unlimited requests · Priority support
                </div>

                {/* Feature comparison */}
                <div
                  style={{
                    background: 'var(--bg)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    fontSize: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {[
                    { label: 'Requests per month', free: `${MAX_FREE.toLocaleString()} max`, pro: 'Unlimited' },
                    { label: 'Virtual keys', free: '3 keys', pro: 'Unlimited' },
                    { label: 'Per-customer tracking', free: '—', pro: '✓' },
                    { label: 'Alert rules', free: '1 alert', pro: 'Unlimited' },
                  ].map((row) => (
                    <div
                      key={row.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ color: 'var(--t2)' }}>{row.label}</span>
                      <div style={{ display: 'flex', gap: 32 }}>
                        <span style={{ color: 'var(--t3)' }}>{row.free}</span>
                        <span style={{ color: 'var(--pri)', fontWeight: 500 }}>{row.pro}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: 'var(--pri-m)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pri)', marginBottom: 4 }}>
                  Pro Plan — Unlimited requests
                </div>
                <div style={{ fontSize: 12, color: 'var(--t2)' }}>
                  You have unrestricted access to the gateway. No request limits.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 10,
            background: toastType === 'success' ? '#1C1B22' : 'var(--err)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 24px rgba(0,0,0,.2)',
            maxWidth: 360,
          }}
        >
          {toast}
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              marginLeft: 4,
            }}
          >
            <IconX size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
