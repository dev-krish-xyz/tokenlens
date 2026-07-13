'use client'
import { IconPlug } from '@tabler/icons-react'

// TODO: trpc.providers.list.useQuery() — replace static data when router is built
const EXAMPLE_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    url: 'api.openai.com',
    status: 'Active',
    models: 'gpt-4o, gpt-4-turbo, gpt-3.5-turbo',
    requests: '9,240',
    cost: '$1,097',
    latency: '310ms',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    url: 'api.anthropic.com',
    status: 'Active',
    models: 'claude-3-opus, claude-3-sonnet',
    requests: '3,601',
    cost: '$187',
    latency: '820ms',
  },
]

export default function ProvidersPage() {
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Providers</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Connected AI providers and their usage stats</div>
        </div>
        <button
          onClick={() => { /* TODO: trpc.providers.create.useMutation() — add provider form */ }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, background: 'var(--pri)', color: '#fff', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
          + Add Provider
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {EXAMPLE_PROVIDERS.map((p) => (
          <div key={p.id} style={{ background: 'var(--surface)', borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2, fontFamily: 'monospace' }}>{p.url}</div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#10B981', fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                {p.status}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--t3)' }}>Models</span>
                <span style={{ fontSize: 11, maxWidth: 180, textAlign: 'right' }}>{p.models}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--t3)' }}>MTD requests</span>
                <span style={{ fontFamily: 'monospace' }}>{p.requests}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--t3)' }}>MTD cost</span>
                <span style={{ fontFamily: 'monospace' }}>{p.cost}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--t3)' }}>Avg latency</span>
                <span style={{ fontFamily: 'monospace' }}>{p.latency}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { /* TODO: trpc.providers.testKey.useMutation({ id: p.id }) */ }}
                style={{ flex: 1, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 11, color: 'var(--t2)', cursor: 'pointer' }}>
                Test Key
              </button>
              <button
                onClick={() => { /* TODO: open edit slide-over for provider */ }}
                style={{ flex: 1, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 11, color: 'var(--t2)', cursor: 'pointer' }}>
                Edit
              </button>
            </div>
          </div>
        ))}

        {/* Add provider card */}
        <div
          onClick={() => { /* TODO: trpc.providers.create.useMutation() */ }}
          style={{ background: 'var(--surface)', border: '1px dashed #E5E5E5', borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--pri)'; e.currentTarget.style.background = 'var(--pri-m)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
        >
          <div style={{ textAlign: 'center', color: 'var(--t3)' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>+</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Add Provider</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Google, Azure, Cohere, Mistral…</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', marginTop: 20, fontSize: 12, color: 'var(--t3)', lineHeight: 1.6 }}>
        {/* TODO: trpc.providers.list.useQuery() — replace static provider data above with real data */}
        <strong style={{ color: 'var(--pri)' }}>Note:</strong> Provider stats shown above are static placeholders. Real per-provider analytics will be available when the providers router is built.
      </div>
    </div>
  )
}
