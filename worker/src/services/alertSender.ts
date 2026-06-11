import { dragonflyClient } from '@tokenlens/shared'

export type AlertPayload = {
  type: 'budget' | 'anomaly' | 'dead_key'
  keyName: string
  workspaceId: string
  message: string
  spend?: number
  cap?: number
  percentage?: number
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function buildAlertEmailHtml(payload: AlertPayload): string {
  return `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto">
<h2 style="color:#d32f2f">TokenLens Alert: ${payload.keyName}</h2>
<p>${payload.message}</p>
${payload.spend !== undefined ? `<p><strong>Spend:</strong> $${payload.spend.toFixed(4)}</p>` : ''}
${payload.cap !== undefined ? `<p><strong>Cap:</strong> $${payload.cap.toFixed(4)}</p>` : ''}
${payload.percentage !== undefined ? `<p><strong>Usage:</strong> ${payload.percentage.toFixed(1)}%</p>` : ''}
<hr>
<p style="color:#666;font-size:12px">Manage alerts at <a href="https://tokenlens.dev/dashboard/budget">https://tokenlens.dev/dashboard/budget</a></p>
</body></html>`
}

export async function sendAlert(channel: string, payload: AlertPayload): Promise<void> {
  if (EMAIL_RE.test(channel)) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env['RESEND_API_KEY'] ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'alerts@tokenlens.dev',
          to: [channel],
          subject: `[TokenLens] ${payload.type === 'budget' ? 'Budget Alert' : 'Spend Anomaly'}: ${payload.keyName}`,
          html: buildAlertEmailHtml(payload),
        }),
      })
      if (!res.ok) {
        console.error(`[alertSender] Resend API error ${res.status}`)
      }
    } catch (err) {
      console.error('[alertSender] Email send failed:', err)
    }
    return
  }

  if (channel.startsWith('https://')) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    try {
      const res = await fetch(channel, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TokenLens-Event': payload.type === 'budget' ? 'budget.alert' : 'anomaly.alert',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      if (!res.ok) {
        console.error(`[alertSender] Webhook error ${res.status}: ${channel}`)
      }
    } catch (err) {
      console.error('[alertSender] Webhook send failed:', err)
    } finally {
      clearTimeout(timeout)
    }
    return
  }

  console.warn(`[alertSender] Unknown channel format, skipping: ${channel}`)
}

export function getHourBucket(): string {
  return new Date().toISOString().slice(0, 13).replace(/[-T:]/g, '')
}

export async function maybeFireAlert(opts: {
  dedupKey: string
  cooldownMin: number
  channel: string
  payload: AlertPayload
}): Promise<void> {
  const existing = await dragonflyClient.get(opts.dedupKey)
  if (existing) return

  await sendAlert(opts.channel, opts.payload)
  await dragonflyClient.setex(opts.dedupKey, opts.cooldownMin * 60, '1')
}
