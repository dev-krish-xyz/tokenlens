import Stripe from 'stripe'
import { TRPCError } from '@trpc/server'
import { protectedWorkspaceProcedure, router } from '../trpc.ts'
import { findById, update } from '@tokenlens/shared/workspaceRepo'
import { getMonthlyRequestCount } from '@tokenlens/shared/services/usageService'
import { env } from '../../../env.ts'

export const MAX_FREE_REQUESTS_PER_MONTH = 50_000

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe not configured' })
  }
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' })
}

export const billingRouter = router({
  createCheckoutSession: protectedWorkspaceProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe()
    if (!env.STRIPE_PRICE_ID_PRO) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe price not configured' })
    }

    const workspace = await findById(ctx.workspaceId)
    if (!workspace) throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found' })

    let customerId = workspace.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: ctx.session.user.email,
        metadata: { workspaceId: ctx.workspaceId },
      })
      customerId = customer.id
      await update(ctx.workspaceId, { stripe_customer_id: customerId })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=1`,
      metadata: { workspaceId: ctx.workspaceId },
    })

    return { url: session.url }
  }),

  getSubscriptionStatus: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const workspace = await findById(ctx.workspaceId)
    if (!workspace) throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found' })

    const tier = (workspace.plan_tier ?? 'free') as 'free' | 'pro' | 'enterprise'
    const requestsUsed = await getMonthlyRequestCount(ctx.workspaceId)
    const requestsLimit = tier === 'free' ? MAX_FREE_REQUESTS_PER_MONTH : null

    return { tier, requestsUsed, requestsLimit }
  }),
})
