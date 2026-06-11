import { redirect } from 'next/navigation'
import { findByToken, accept } from '@tokenlens/shared/inviteRepo'
import { getSession } from '../../../lib/session.ts'

function InviteErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
        <div className="text-3xl">&#x26A0;&#xFE0F;</div>
        <h1 className="text-lg font-semibold text-gray-900">Invitation Invalid</h1>
        <p className="text-sm text-gray-500">{message}</p>
        <a
          href="/login"
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Back to login
        </a>
      </div>
    </div>
  )
}

function InviteLandingPage({ token, email, workspaceName }: { token: string; email: string; workspaceName?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
        <h1 className="text-lg font-semibold text-gray-900">You have been invited</h1>
        {workspaceName && (
          <p className="text-sm text-gray-500">
            Join <strong>{workspaceName}</strong> on TokenLens.
          </p>
        )}
        <p className="text-xs text-gray-400">You need to log in or create an account to accept this invitation.</p>
        <a
          href={`/login?callbackUrl=/invite/${token}`}
          className="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Log in to accept
        </a>
        <p className="text-xs text-gray-400">
          No account yet?{' '}
          <a href={`/register?callbackUrl=/invite/${token}&email=${encodeURIComponent(email)}`} className="text-indigo-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
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

  try {
    await accept(token, session.user.id)
  } catch {
    return <InviteErrorPage message="This invite is invalid or has expired." />
  }

  redirect('/dashboard')
}
