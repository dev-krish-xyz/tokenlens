import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', color: '#1C1B22', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13 }}>
      {/* Nav */}
      <nav style={{ height: 56, borderBottom: '1px solid #EAEAEA', background: '#FAFAFA', display: 'flex', alignItems: 'center', padding: '0 40px', gap: 32, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5A4EC7', display: 'inline-block' }} />
          TokenLens
        </div>
        <div style={{ display: 'flex', gap: 24, marginLeft: 20 }}>
          {['Docs', 'Pricing', 'Changelog', 'Blog'].map((l) => (
            <a key={l} href="#" style={{ fontSize: 13, color: '#474553', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <Link href="/login" style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #EAEAEA', background: '#fff', fontSize: 12, color: '#474553', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/register" style={{ padding: '8px 18px', borderRadius: 8, background: '#5A4EC7', color: '#fff', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: '64px 40px 48px', textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EDE9FF', color: '#5A4EC7', fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 9999, marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5A4EC7', display: 'inline-block' }} />
          Now in public beta — free for 30 days
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 18, color: '#1C1B22' }}>
          Stop <span style={{ color: '#5A4EC7' }}>overpaying</span> for AI.<br />Enforce budgets before the call.
        </h1>
        <p style={{ fontSize: 16, color: '#474553', lineHeight: 1.6, maxWidth: 540, margin: '0 auto 32px' }}>
          TokenLens is the AI cost governance control plane. Block over-budget requests before they hit OpenAI — not after.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 48 }}>
          <Link href="/register" style={{ padding: '11px 32px', borderRadius: 9999, background: '#5A4EC7', color: '#fff', fontSize: 14, fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}>Get started free</Link>
          <Link href="/dashboard" style={{ padding: '11px 32px', borderRadius: 9999, background: 'transparent', color: '#5A4EC7', fontSize: 14, fontWeight: 500, border: '1px solid #5A4EC7', textDecoration: 'none', display: 'inline-block' }}>View demo →</Link>
        </div>
        <p style={{ fontSize: 12, color: '#787585' }}>
          Trusted by teams at <strong style={{ color: '#1C1B22' }}>Vercel</strong>, <strong style={{ color: '#1C1B22' }}>Supabase</strong>, <strong style={{ color: '#1C1B22' }}>Linear</strong>, and 200+ others
        </p>
      </div>

      {/* Gateway chain */}
      <div style={{ padding: '0 40px 48px' }}>
        <div style={{ background: '#fff', border: '1px solid #EAEAEA', borderRadius: 16, maxWidth: 740, margin: '0 auto', padding: '20px 28px', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
          <div style={{ fontSize: 11, color: '#787585', marginBottom: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            6-step gateway middleware chain — enforced in order
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            {['Your App', 'rateLimiter', 'requestValidator', 'keyResolver'].map((s) => (
              <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: '#EDE9FF', border: '1px solid #5A4EC7', color: '#5A4EC7' }}>{s}</span>
                <span style={{ color: '#EAEAEA', fontSize: 16, padding: '0 4px' }}>→</span>
              </span>
            ))}
            <span style={{ padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: '#FEF2F2', border: '1px solid #BA1A1A', color: '#BA1A1A' }}>budgetEnforcer ⊘</span>
            <span style={{ color: '#BA1A1A', fontSize: 14, padding: '0 4px' }}>✕</span>
            {['providerProxy', 'logAsync'].map((s) => (
              <span key={s} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: '#FAFAFA', border: '1px solid #EAEAEA', color: '#787585', opacity: 0.5 }}>{s}</span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: '#787585', textAlign: 'center', marginTop: 10, fontFamily: 'monospace' }}>
            HTTP 429 returned before calling OpenAI · $0 wasted on blocked requests
          </div>
        </div>
      </div>

      {/* Features bento */}
      <div style={{ padding: '0 40px 56px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#787585', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Why TokenLens</div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 28 }}>Every dollar in, every token out — governed.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {/* Budget enforcement */}
          <div style={{ background: '#fff', border: '1px solid #EAEAEA', borderRadius: 16, padding: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EDE9FF', color: '#5A4EC7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 18 }}>🛡️</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Hard Budget Enforcement</div>
            <div style={{ fontSize: 12, color: '#474553', lineHeight: 1.6 }}>Block requests at the gateway before they reach your provider. HTTP 429 — $0 overage guaranteed.</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF2F2', color: '#BA1A1A', fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 9999, marginTop: 12 }}>⊘ HTTP 429 — Budget exceeded</div>
          </div>

          {/* Per-customer margin */}
          <div style={{ background: '#fff', border: '1px solid #EAEAEA', borderRadius: 16, padding: 24, gridColumn: 'span 2' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 18 }}>👥</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Per-Customer Margin Intelligence</div>
            <div style={{ fontSize: 12, color: '#474553', lineHeight: 1.6, marginBottom: 14 }}>
              Pass <code style={{ fontFamily: 'monospace', fontSize: 11, background: '#F6F2FD', padding: '1px 5px', borderRadius: 4, color: '#5A4EC7' }}>X-TL-User-Id</code> to see exactly how much AI each customer costs vs their plan revenue.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[{ name: 'acme-corp', w: '82%', val: '$41.2', c: '#5A4EC7' }, { name: 'linear-app', w: '91%', val: '$45.6', c: '#D97706' }, { name: 'notion-co', w: '35%', val: '$17.5', c: '#16A34A' }].map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: '#474553', width: 80, flexShrink: 0 }}>{c.name}</span>
                  <div style={{ flex: 1, height: 5, background: '#EAEAEA', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: c.w, background: c.c, borderRadius: 9999 }} />
                  </div>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#787585', width: 36, textAlign: 'right' }}>{c.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* One-line integration */}
          <div style={{ background: '#fff', border: '1px solid #EAEAEA', borderRadius: 16, padding: 24, gridColumn: 'span 2' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 18 }}>{'</>'}</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>One-line integration</div>
            <div style={{ background: '#F6F2FD', border: '1px solid #EAEAEA', borderRadius: 10, padding: '12px 14px', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, color: '#1C1B22', marginTop: 10 }}>
              <span style={{ color: '#787585' }}>{'// Before'}</span><br />
              baseURL: <span style={{ color: '#16A34A' }}>"https://api.openai.com/v1"</span><br /><br />
              <span style={{ color: '#787585' }}>{'// After'}</span><br />
              baseURL: <span style={{ color: '#16A34A' }}>"https://gateway.tokenlens.ai/v1"</span><br />
              headers: {'{ '}<span style={{ color: '#5A4EC7' }}>X-TL-Key</span>: <span style={{ color: '#16A34A' }}>"tl-vk-..."</span> {'}'}
            </div>
          </div>

          {/* Forecasting */}
          <div style={{ background: '#fff', border: '1px solid #EAEAEA', borderRadius: 16, padding: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 18 }}>📈</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Spend Forecasting</div>
            <div style={{ fontSize: 12, color: '#474553', lineHeight: 1.6 }}>ML-based 30-day projections with anomaly detection. Know before you blow.</div>
            <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'monospace', color: '#D97706', marginTop: 12 }}>$3,420</div>
            <div style={{ fontSize: 11, color: '#787585' }}>30-day forecast (+18% vs last month)</div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div style={{ padding: '0 40px 60px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: '#787585', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Pricing</div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 28 }}>Simple, usage-based pricing.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {/* Starter */}
          <div style={{ background: '#fff', border: '1px solid #EAEAEA', borderRadius: 16, padding: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#474553', marginBottom: 4 }}>Starter</div>
            <div style={{ fontSize: 32, fontWeight: 600, fontFamily: 'monospace' }}>$0</div>
            <div style={{ fontSize: 12, color: '#787585', marginBottom: 20 }}>Free forever · up to $500 governed</div>
            {['3 virtual keys', '1 provider', '7-day log retention', 'Community support'].map((f) => (
              <div key={f} style={{ fontSize: 12, color: '#474553', padding: '5px 0', borderBottom: '1px solid #F5F5F5', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: '#16A34A' }}>✓</span>{f}
              </div>
            ))}
            <Link href="/register" style={{ display: 'block', width: '100%', marginTop: 20, padding: '10px', borderRadius: 8, border: '1px solid #EAEAEA', background: '#fff', fontSize: 13, color: '#474553', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>Start free</Link>
          </div>

          {/* Pro */}
          <div style={{ background: '#fff', border: '2px solid #5A4EC7', borderRadius: 16, padding: 28, boxShadow: '0 0 0 1px #5A4EC7' }}>
            <div style={{ display: 'inline-block', fontSize: 10, background: '#EDE9FF', color: '#5A4EC7', padding: '2px 8px', borderRadius: 9999, marginBottom: 10 }}>Most popular</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#474553', marginBottom: 4 }}>Pro</div>
            <div style={{ fontSize: 32, fontWeight: 600, fontFamily: 'monospace' }}>$49</div>
            <div style={{ fontSize: 12, color: '#787585', marginBottom: 20 }}>per month · unlimited governed</div>
            {['Unlimited virtual keys', 'All providers', 'Per-customer margin tracking', 'Forecasting & anomaly alerts'].map((f) => (
              <div key={f} style={{ fontSize: 12, color: '#474553', padding: '5px 0', borderBottom: '1px solid #F5F5F5', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: '#16A34A' }}>✓</span>{f}
              </div>
            ))}
            <Link href="/register" style={{ display: 'block', width: '100%', marginTop: 20, padding: '10px', borderRadius: 8, background: '#5A4EC7', color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>Start 30-day trial</Link>
          </div>

          {/* Enterprise */}
          <div style={{ background: '#fff', border: '1px solid #EAEAEA', borderRadius: 16, padding: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#474553', marginBottom: 4 }}>Enterprise</div>
            <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'monospace', margin: '8px 0' }}>Custom</div>
            <div style={{ fontSize: 12, color: '#787585', marginBottom: 20 }}>SSO · SLA · dedicated support</div>
            {['On-prem gateway', 'SAML / SCIM', 'Custom contracts', '99.99% SLA'].map((f) => (
              <div key={f} style={{ fontSize: 12, color: '#474553', padding: '5px 0', borderBottom: '1px solid #F5F5F5', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: '#16A34A' }}>✓</span>{f}
              </div>
            ))}
            <button style={{ display: 'block', width: '100%', marginTop: 20, padding: '10px', borderRadius: 8, border: '1px solid #EAEAEA', background: '#fff', fontSize: 13, color: '#474553', cursor: 'pointer', fontFamily: 'inherit' }}>Talk to sales</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #EAEAEA', padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>TokenLens</div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'Status', 'Docs', 'GitHub'].map((l) => (
            <a key={l} href="#" style={{ fontSize: 12, color: '#787585', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#787585' }}>© 2025 TokenLens, Inc.</div>
      </footer>
    </div>
  )
}
