'use client'
import { useState } from 'react'
import { IconPlus, IconCopy } from '@tabler/icons-react'

// TODO: replace with trpc.environments.list.useQuery() when router is built
type Env = { id: string; name: string; endpoint: string; keyCount: number; mtdSpend: string; status: 'Active' | 'Limited' | 'Inactive' }

const EXAMPLE_ENVS: Env[] = [
  { id: '1', name: 'Production', endpoint: 'https://gateway.tokenlens.ai', keyCount: 3, mtdSpend: '$1,084', status: 'Active' },
  { id: '2', name: 'Staging', endpoint: 'https://staging.tokenlens.ai', keyCount: 1, mtdSpend: '$182', status: 'Limited' },
]

const STATUS_CHIP: Record<string, { bg: string; color: string }> = {
  Active: { bg: '#DCFCE7', color: '#16A34A' },
  Limited: { bg: '#FEF3C7', color: '#D97706' },
  Inactive: { bg: '#F4F4F5', color: '#474553' },
}

export default function EnvironmentsPage() {
  const [envs] = useState<Env[]>(EXAMPLE_ENVS)
  const [copied, setCopied] = useState<string | null>(null)

  async function copyEndpoint(endpoint: string) {
    await navigator.clipboard.writeText(endpoint)
    setCopied(endpoint)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Environments</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Separate gateway endpoints for production, staging, and dev</div>
        </div>
        <button
          onClick={() => { /* TODO: trpc.environments.create.useMutation() */ }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: 'var(--pri)', color: '#fff', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
          <IconPlus size={14} />
          New Environment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {envs.map((env) => {
          const chip = STATUS_CHIP[env.status] ?? STATUS_CHIP.Inactive!
          return (
            <div key={env.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: env.status === 'Active' ? '3px solid var(--pri)' : '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>{env.name}</div>
                <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 500, background: chip.bg, color: chip.color }}>{env.status}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>Gateway endpoint</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, background: '#F5F5F5', padding: '8px 10px', borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{env.endpoint}</span>
                <button onClick={() => void copyEndpoint(env.endpoint)}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '3px 8px', borderRadius: 6, background: copied === env.endpoint ? '#16A34A' : 'var(--pri)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10 }}>
                  <IconCopy size={11} />
                  {copied === env.endpoint ? ' Copied!' : ' Copy'}
                </button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                {env.keyCount} key{env.keyCount !== 1 ? 's' : ''} · {env.mtdSpend} spent this month
              </div>
            </div>
          )
        })}

        {/* Add new card */}
        <div
          onClick={() => { /* TODO: trpc.environments.create.useMutation() */ }}
          style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 14, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160, cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--pri)'; e.currentTarget.style.background = 'var(--pri-m)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
        >
          <div style={{ textAlign: 'center', color: 'var(--t3)' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>+</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>New Environment</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Add dev, staging, or custom</div>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div style={{ background: 'var(--pri-m)', border: '1px solid #C4B8FF', borderRadius: 12, padding: '14px 16px', marginTop: 20, fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--pri)' }}>Environments</strong> let you route different teams or deployment stages through separate gateway endpoints.
        Each environment has its own virtual keys, budget caps, and rate limits.{' '}
        {/* TODO: trpc.environments.create.useMutation() — wire the New Environment button */}
      </div>
    </div>
  )
}
