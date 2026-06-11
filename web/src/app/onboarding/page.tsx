'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Step = 1 | 2 | 3 | 4 | 5 | 6

const STEPS = [
  { n: 1, label: 'Connect provider' },
  { n: 2, label: 'Install SDK' },
  { n: 3, label: 'Create budget' },
  { n: 4, label: 'Tag customers', badge: 'key' },
  { n: 5, label: 'Invite team' },
  { n: 6, label: 'Done' },
] as const

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI', icon: '🟢' },
  { id: 'anthropic', label: 'Anthropic', icon: '🟣' },
  { id: 'gemini', label: 'Gemini', icon: '🔵' },
  { id: 'mistral', label: 'Mistral', icon: '🟡' },
  { id: 'cohere', label: 'Cohere', icon: '⚫' },
  { id: 'azure', label: 'Azure AI', icon: '🔴' },
]

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: '#474553', display: 'block', marginBottom: 5,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #EAEAEA', borderRadius: 8,
  fontSize: 13, background: '#FAFAFA', color: '#1C1B22', outline: 'none', fontFamily: 'inherit',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [apiKey, setApiKey] = useState('')
  const [budgetCap, setBudgetCap] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')

  const done = [1, 2, 3, 4, 5, 6].filter((n) => n < step)

  function next() {
    // TODO: trpc.onboarding.saveStep.useMutation() — persist step data
    if (step < 6) setStep((step + 1) as Step)
    else router.push('/dashboard')
  }

  const stepDots = [1, 2, 3, 4, 5, 6]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#FAFAFA', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, color: '#1C1B22' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: '#fff', borderRight: '1px solid #EAEAEA', padding: '28px 20px', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 32 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5A4EC7', display: 'inline-block' }} />
          TokenLens
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((s, i) => {
            const isDone = done.includes(s.n)
            const isActive = step === s.n
            return (
              <div key={s.n} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0' }}>
                  {/* Circle */}
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    background: isDone ? '#16A34A' : isActive ? '#5A4EC7' : '#fff',
                    border: `1.5px solid ${isDone ? '#16A34A' : isActive ? '#5A4EC7' : '#EAEAEA'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 500,
                    color: isDone || isActive ? '#fff' : '#787585',
                  }}>
                    {isDone ? '✓' : s.n}
                  </div>
                  <div style={{ paddingTop: 3, fontSize: 12, color: isDone ? '#16A34A' : isActive ? '#1C1B22' : '#787585', fontWeight: isActive ? 500 : 400 }}>
                    {s.label}
                    {'badge' in s && s.badge && (
                      <span style={{ fontSize: 9, background: '#EDE9FF', color: '#5A4EC7', padding: '1px 5px', borderRadius: 9999, marginLeft: 6, fontWeight: 600 }}>key</span>
                    )}
                  </div>
                </div>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', left: 11, top: 30, width: 1, height: 20, background: '#EAEAEA', zIndex: 0 }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, background: '#FAFAFA', padding: 40, overflowY: 'auto' }}>
        {/* Step 1 */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#787585', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Step 1 of 6</div>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Connect your AI provider</div>
            <div style={{ fontSize: 13, color: '#474553', marginBottom: 24 }}>Select a provider and add your API key. TokenLens proxies through your key — you keep full ownership.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
              {PROVIDERS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  style={{
                    background: selectedProvider === p.id ? '#EDE9FF' : '#fff',
                    border: `${selectedProvider === p.id ? 2 : 1.5}px solid ${selectedProvider === p.id ? '#5A4EC7' : '#EAEAEA'}`,
                    borderRadius: 12, padding: 14, textAlign: 'center', cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{p.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{p.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{PROVIDERS.find((p) => p.id === selectedProvider)?.label} API Key</label>
              <input
                type="password"
                style={{ ...inputStyle, maxWidth: 400, fontFamily: 'monospace' }}
                placeholder="sk-proj-••••••••••••••"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              {/* TODO: trpc.providers.testKey.useMutation() — validate the API key */}
            </div>
            {apiKey.length > 10 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 500 }}>Key looks valid · provider models available</span>
              </div>
            )}
            <StepFooter step={1} total={6} onContinue={next} onSkip={() => setStep(4)} skipLabel="Skip to Step 4" />
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#787585', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Step 2 of 6</div>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Install the SDK / point your gateway</div>
            <div style={{ fontSize: 13, color: '#474553', marginBottom: 20 }}>Change one line in your existing OpenAI client. No new SDK required.</div>
            <div style={{ background: '#1C1B22', borderRadius: 10, padding: '14px 16px', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, color: '#e0e0e0', marginBottom: 20 }}>
              <span style={{ color: '#6A6A7A' }}>{'// Before'}</span><br />
              baseURL: <span style={{ color: '#80CBC4' }}>"https://api.openai.com/v1"</span><br /><br />
              <span style={{ color: '#6A6A7A' }}>{'// After — that\'s it'}</span><br />
              baseURL: <span style={{ color: '#80CBC4' }}>"https://gateway.tokenlens.ai/v1"</span><br />
              headers: {'{ '}<span style={{ color: '#B39DDB' }}>Authorization</span>: <span style={{ color: '#80CBC4' }}>"Bearer tl-vk-your-key"</span> {'}'}
            </div>
            <div style={{ background: '#F6F2FD', border: '1px solid #D4CBFF', borderRadius: 10, padding: '14px 16px', fontSize: 12, color: '#474553', lineHeight: 1.6 }}>
              <strong style={{ color: '#5A4EC7' }}>Your real API key is never exposed.</strong> TokenLens decrypts it server-side and forwards the request. Your developers only see virtual keys.
            </div>
            <StepFooter step={2} total={6} onContinue={next} onSkip={next} />
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#787585', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Step 3 of 6</div>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Create a budget</div>
            <div style={{ fontSize: 13, color: '#474553', marginBottom: 24 }}>Set a monthly spend limit. When reached, the gateway returns 429 — $0 overage, zero surprises.</div>
            <div style={{ marginBottom: 16, maxWidth: 400 }}>
              <label style={labelStyle}>Monthly budget cap (USD)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #EAEAEA', fontSize: 13, background: '#F5F5F5', color: '#787585', flexShrink: 0 }}>$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="500"
                  value={budgetCap}
                  onChange={(e) => setBudgetCap(e.target.value)}
                />
              </div>
              {/* TODO: trpc.workspace.updateBudgetCap.useMutation() — save budget on Continue */}
              <div style={{ fontSize: 11, color: '#787585', marginTop: 5 }}>Leave blank to skip (you can set this later in Settings)</div>
            </div>
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 16px', fontSize: 12, color: '#92400E', lineHeight: 1.6, maxWidth: 400 }}>
              <strong>Hard limit:</strong> When spend reaches this cap, ALL requests through this workspace return HTTP 429. No overage, ever.
            </div>
            <StepFooter step={3} total={6} onContinue={next} onSkip={next} />
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#787585', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Step 4 of 6</div>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
              Tag your customers{' '}
              <span style={{ fontSize: 11, background: '#EDE9FF', color: '#5A4EC7', padding: '2px 8px', borderRadius: 9999, verticalAlign: 'middle', fontWeight: 500 }}>Recommended</span>
            </div>
            <div style={{ fontSize: 13, color: '#474553', marginBottom: 20 }}>
              Pass <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#F6F2FD', padding: '1px 5px', borderRadius: 4, color: '#5A4EC7' }}>X-TL-User-Id</code> to unlock per-customer margin intelligence.
            </div>
            <div style={{ background: '#1C1B22', borderRadius: 10, padding: '14px 16px', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, color: '#e0e0e0' }}>
              <span style={{ color: '#6A6A7A' }}>{'// Add this header to every AI request'}</span><br />
              openai.chat.completions.create({'({'}<br />
              &nbsp;&nbsp;model: <span style={{ color: '#80CBC4' }}>"gpt-4o"</span>,<br />
              &nbsp;&nbsp;messages: [...],<br />
              &nbsp;&nbsp;extraHeaders: {'{'}<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#B39DDB' }}>"X-TL-User-Id"</span>: <span style={{ color: '#80CBC4' }}>currentUser.id</span>,&nbsp;&nbsp;<span style={{ color: '#6A6A7A' }}>{'// your customer ID'}</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#B39DDB' }}>"X-TL-Feature"</span>: <span style={{ color: '#80CBC4' }}>"chat"</span>,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#6A6A7A' }}>{'// optional: feature tag'}</span><br />
              &nbsp;&nbsp;{'}'}<br />
              {'})'}
            </div>
            <div style={{ background: '#F6F2FD', border: '1px solid #D4CBFF', borderRadius: 10, padding: '14px 16px', marginTop: 16, fontSize: 12, color: '#474553', lineHeight: 1.6 }}>
              <strong style={{ color: '#5A4EC7' }}>Why this matters:</strong> Without customer tagging you see total spend. With it, you see which customers eat your margin and can set per-customer budgets.
            </div>
            <StepFooter step={4} total={6} onContinue={next} onSkip={next} skipLabel="Skip" continueLabel="I've added the header →" />
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#787585', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Step 5 of 6</div>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Invite your team</div>
            <div style={{ fontSize: 13, color: '#474553', marginBottom: 24 }}>Add teammates so they can monitor usage and manage keys with the right roles.</div>
            <div style={{ marginBottom: 16, maxWidth: 400 }}>
              <label style={labelStyle}>Team member email</label>
              <input
                type="email"
                style={inputStyle}
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              {/* TODO: trpc.invite.sendInvite.useMutation() — send invite on Continue */}
            </div>
            <StepFooter step={5} total={6} onContinue={next} onSkip={next} skipLabel="Skip for now" />
          </div>
        )}

        {/* Step 6 — Done */}
        {step === 6 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28 }}>✓</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>You're all set!</div>
            <div style={{ fontSize: 13, color: '#474553', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 28px' }}>
              TokenLens is now governing your AI spend. Your first request through the gateway will appear in logs within seconds.
            </div>
            <div style={{ maxWidth: 360, margin: '0 auto 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: `${PROVIDERS.find((p) => p.id === selectedProvider)?.label ?? 'Provider'} connected` },
                { label: budgetCap ? `Budget: $${budgetCap}/mo · hard limit active` : 'No budget cap set (set one in Settings)' },
                { label: 'Customer tagging ready' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #EAEAEA', borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
                  {item.label}
                </div>
              ))}
            </div>
            <Link href="/dashboard" style={{ display: 'inline-block', padding: '12px 40px', borderRadius: 8, background: '#5A4EC7', color: '#fff', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
              Go to Dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StepFooter({
  step, total, onContinue, onSkip,
  skipLabel = 'Skip',
  continueLabel = 'Continue →',
}: {
  step: number
  total: number
  onContinue: () => void
  onSkip?: () => void
  skipLabel?: string
  continueLabel?: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, marginTop: 20, borderTop: '1px solid #EAEAEA' }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 9999,
              background: i < step ? '#16A34A' : i === step - 1 ? '#5A4EC7' : '#EAEAEA',
              width: i === step - 1 ? 18 : 6,
              height: 6,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {onSkip && (
          <button
            onClick={onSkip}
            style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #EAEAEA', background: '#fff', fontSize: 13, color: '#474553', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {skipLabel}
          </button>
        )}
        <button
          onClick={onContinue}
          style={{ padding: '9px 24px', borderRadius: 8, background: '#5A4EC7', color: '#fff', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {continueLabel}
        </button>
      </div>
    </div>
  )
}
