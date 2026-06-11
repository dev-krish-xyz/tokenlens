import Stripe from 'stripe'
import { env } from '../../../../env.ts'
import { update, findByStripeSubId } from '@tokenlens/shared/workspaceRepo'
import { invalidatePlanCache } from '@tokenlens/shared/services/planService'

type PlanTier = 'free' | 'pro' | 'enterprise'

function getStripe(): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2026-05-27.dahlia' })
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.metadata?.workspaceId) {
        await handleSubscriptionActivated(
          session.metadata.workspaceId,
          session.subscription as string,
        )
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await handleSubscriptionChange(sub)
      break
    }
  }

  return Response.json({ received: true })
}

async function handleSubscriptionActivated(
  workspaceId: string,
  subscriptionId: string,
): Promise<void> {
  await update(workspaceId, { plan_tier: 'pro', stripe_subscription_id: subscriptionId })
  await invalidatePlanCache(workspaceId)
}

async function handleSubscriptionChange(sub: Stripe.Subscription): Promise<void> {
  const workspaceId =
    sub.metadata?.workspaceId ?? (await findByStripeSubId(sub.id))?.id

  if (!workspaceId) return

  const newTier: PlanTier = sub.status === 'active' ? 'pro' : 'free'
  await update(workspaceId, { plan_tier: newTier })
  await invalidatePlanCache(workspaceId)
}
