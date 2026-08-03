'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp, signIn } from '../../../lib/auth-client.ts'
import { TokenLensLogo } from '../../../components/TokenLensLogo.tsx'

const GOOGLE_SVG = (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #EAEAEA',
  borderRadius: 8,
  fontSize: 13,
  background: '#FAFAFA',
  color: '#1C1B22',
  outline: 'none',
  fontFamily: 'inherit',
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await signUp.email({ name, email, password })
    setLoading(false)
    if (err) {
      setError(err.message ?? 'Registration failed')
      return
    }
    router.push('/dashboard')
  }

  async function handleGoogle() {
    await signIn.social({ provider: 'google', callbackURL: '/dashboard' })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Nav */}
      <nav
        style={{
          height: 52,
          borderBottom: '1px solid #EAEAEA',
          background: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#1C1B22',
          }}
        >
          <TokenLensLogo size={22} />
          TokenLens
        </div>
      </nav>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          padding: 32,
          maxWidth: 900,
          margin: '0 auto',
          width: '100%',
          alignItems: 'center',
        }}
      >
        {/* Left — form */}
        <div
          style={{
            width: 420,
            background: '#fff',
            border: '1px solid #EAEAEA',
            borderRadius: 16,
            padding: 40,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              marginBottom: 4,
              color: '#1C1B22',
            }}
          >
            Create your account
          </div>
          <div style={{ fontSize: 13, color: '#474553', marginBottom: 28 }}>
            Free for 30 days · no credit card required
          </div>

          <button
            onClick={handleGoogle}
            style={{
              width: '100%',
              padding: 9,
              borderRadius: 8,
              fontSize: 13,
              color: '#474553',
              border: '1px solid #EAEAEA',
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 16,
              fontFamily: 'inherit',
            }}
          >
            {GOOGLE_SVG}
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#EAEAEA' }} />
            <span style={{ fontSize: 12, color: '#787585' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#EAEAEA' }} />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                fontSize: 12,
                color: '#BA1A1A',
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#474553', display: 'block', marginBottom: 5 }}>
                Full name
              </label>
              <input
                type="text"
                required
                style={inputStyle}
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#474553', display: 'block', marginBottom: 5 }}>
                Work email
              </label>
              <input
                type="email"
                required
                style={inputStyle}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#474553', display: 'block', marginBottom: 5 }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                style={inputStyle}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                background: '#5A4EC7',
                color: '#fff',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: 12, color: '#787585', marginTop: 16 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#5A4EC7', fontWeight: 500, textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>

        {/* Right — brand panel */}
        <div
          style={{
            flex: 1,
            background: '#5A4EC7',
            borderRadius: 16,
            marginLeft: 16,
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            minHeight: 480,
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'monospace', color: '#fff', marginBottom: 4 }}>
              $0 wasted
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>
              Budget enforcement blocks requests before they reach providers
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'monospace', color: '#fff', marginBottom: 4 }}>
              1 line
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>
              Change your baseURL and add one header — integration complete
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic' }}>
            {'"The per-customer cost breakdown was exactly what we needed to understand our AI margin."'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
            — Engineering team
          </div>
        </div>
      </div>
    </div>
  )
}
