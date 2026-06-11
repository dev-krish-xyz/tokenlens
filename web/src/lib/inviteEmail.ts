import { env } from '../env.ts'
import type { WorkspaceRole } from '@tokenlens/shared'

function buildInviteEmailHtml(opts: {
  inviterName: string
  workspaceName: string
  role: WorkspaceRole
  inviteUrl: string
}): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 480px; margin: 40px auto; color: #111;">
  <h2 style="font-size: 20px; margin-bottom: 8px;">You've been invited</h2>
  <p style="color: #555; margin-bottom: 24px;">
    <strong>${opts.inviterName}</strong> invited you to join
    <strong>${opts.workspaceName}</strong> on TokenLens as <strong>${opts.role}</strong>.
  </p>
  <a href="${opts.inviteUrl}"
     style="display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px;
            border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
    Accept Invitation
  </a>
  <p style="margin-top: 24px; color: #888; font-size: 13px;">
    This invitation expires in 48 hours.
  </p>
  <p style="color: #aaa; font-size: 12px;">
    If you didn't expect this, you can safely ignore this email.
  </p>
</body>
</html>`
}

export async function sendInviteEmail(opts: {
  toEmail: string
  inviterName: string
  workspaceName: string
  role: WorkspaceRole
  inviteUrl: string
}): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'invites@tokenlens.dev',
      to: [opts.toEmail],
      subject: `${opts.inviterName} invited you to ${opts.workspaceName} on TokenLens`,
      html: buildInviteEmailHtml(opts),
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to send invite email: Resend returned ${res.status}`)
  }
}
