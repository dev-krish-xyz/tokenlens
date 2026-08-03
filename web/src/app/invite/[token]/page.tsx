import { redirect } from 'next/navigation'
import { findByToken, accept } from '@tokenlens/shared/inviteRepo'
import { getSession } from '../../../lib/session.ts'
import { TokenLensLogo } from '../../../components/TokenLensLogo.tsx'

function InviteErrorPage({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid #EAEAEA',
          borderRadius: 16,
          padding: '40px 32px',
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,.04)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 24,
          }}
        >
          ⚠️
        </div>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#1C1B22',
            marginBottom: 8,
          }}
        >
          Invitation Invalid
        </h1>
        <p style={{ fontSize: 13, color: '#787585', lineHeight: 1.6, marginBottom: 24 }}>
          {message}
        </p>
        <a
          href="/login"
          style={{
            display: 'inline-block',
            padding: '9px 24px',
            borderRadius: 8,
            background: '#5A4EC7',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Back to login
        </a>
      </div>
    </div>
  )
}

function InviteLandingPage({
  token,
  email,
  workspaceName,
}: {
  token: string
  email: string
  workspaceName?: string
}) {
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
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #EAEAEA',
            borderRadius: 16,
            padding: '40px 32px',
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,.04)',
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#EDE9FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#5A4EC7',
                display: 'inline-block',
              }}
            />
          </div>

          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#1C1B22',
              letterSpacing: '-0.01em',
              marginBottom: 8,
            }}
          >
            You've been invited
          </h1>

          {workspaceName && (
            <p style={{ fontSize: 14, color: '#474553', marginBottom: 8 }}>
              Join <strong>{workspaceName}</strong> on TokenLens
            </p>
          )}

          <p style={{ fontSize: 12, color: '#787585', lineHeight: 1.6, marginBottom: 28 }}>
            You need to log in or create an account to accept this invitation.
            {email && (
              <>
                {' '}
                The invite was sent to{' '}
                <strong style={{ color: '#474553' }}>{email}</strong>.
              </>
            )}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a
              href={`/login?callbackUrl=/invite/${token}`}
              style={{
                display: 'block',
                padding: '10px 24px',
                borderRadius: 8,
                background: '#5A4EC7',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Log in to accept
            </a>
            <a
              href={`/register?callbackUrl=/invite/${token}&email=${encodeURIComponent(email)}`}
              style={{
                display: 'block',
                padding: '10px 24px',
                borderRadius: 8,
                border: '1px solid #EAEAEA',
                background: '#fff',
                color: '#474553',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Create account
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const invite = await findByToken(token)

  if (!invite || invite.accepted_at !== null || invite.expires_at < new Date()) {
    return <InviteErrorPage message="This invite is invalid or has expired." />
  }

  const session = await getSession()

  if (!session) {
    return (
      <InviteLandingPage
        token={token}
        email={invite.email}
      />
    )
  }

  // The token alone must not grant membership — the invite was addressed to a
  // specific email, so the logged-in account has to match it.
  if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <InviteErrorPage message="This invite was sent to a different email address. Log in with the invited account to accept it." />
    )
  }

  try {
    await accept(token, session.user.id)
  } catch {
    return <InviteErrorPage message="This invite is invalid or has expired." />
  }

  redirect('/dashboard')
}
