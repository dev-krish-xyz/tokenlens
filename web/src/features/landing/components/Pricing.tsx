'use client'

import Link from 'next/link'
import { IconCheck, IconSparkles } from '@tabler/icons-react'
import {
  FadeIn,
  Section,
  SectionLabel,
  SectionSub,
  SectionTitle,
  Stagger,
  StaggerItem,
} from './ui.tsx'

const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    period: '',
    detail: 'Free forever · up to $500 governed',
    cta: 'Start free',
    href: '/register',
    popular: false,
    features: ['3 virtual keys', '1 provider', '7-day log retention', 'Community support'],
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    detail: 'Unlimited governed spend',
    cta: 'Start 30-day trial',
    href: '/register',
    popular: true,
    features: [
      'Unlimited virtual keys',
      'All providers',
      'Per-customer margin tracking',
      'Forecasting & anomaly alerts',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    detail: 'SSO · SLA · dedicated support',
    cta: 'Talk to sales',
    href: 'mailto:sales@tokenlens.ai',
    popular: false,
    features: ['Dedicated support', 'SAML / SCIM', 'Custom contracts', 'SLA options'],
  },
]

export function Pricing() {
  return (
    <Section id="pricing" className="relative py-20 sm:py-24 lg:py-28">
      <div aria-hidden className="lp-section-wash" />

      <FadeIn>
        <SectionLabel>07 — Pricing</SectionLabel>
        <SectionTitle>Simple, usage-based pricing.</SectionTitle>
        <SectionSub>
          Start free. Scale when governance becomes mission-critical — not before.
        </SectionSub>
      </FadeIn>

      <Stagger className="mt-14 grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => (
          <StaggerItem key={plan.name}>
            <div
              className={`group relative flex h-full flex-col overflow-hidden rounded-[22px] transition duration-300 ${
                plan.popular
                  ? 'bg-[var(--lp-ink)] text-white shadow-[0_20px_50px_-16px_rgba(9,9,11,0.45)] ring-1 ring-black/10'
                  : 'border border-[var(--lp-line)] bg-white shadow-[var(--lp-card-shadow)] hover:shadow-[var(--lp-card-shadow-hover)]'
              }`}
            >
              {plan.popular && (
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#818CF8] to-transparent" />
              )}

              <div className="flex flex-1 flex-col p-7 sm:p-8">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-[13px] font-medium ${
                      plan.popular ? 'text-white/60' : 'text-[var(--lp-muted)]'
                    }`}
                  >
                    {plan.name}
                  </p>
                  {plan.popular && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#C7D2FE]">
                      <IconSparkles size={12} />
                      Popular
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <p
                    className={`lp-mono font-semibold tracking-tight ${
                      plan.price === 'Custom' ? 'text-[28px]' : 'text-[40px] sm:text-[44px]'
                    } ${plan.popular ? 'text-white' : 'text-[var(--lp-ink)]'}`}
                  >
                    {plan.price}
                  </p>
                  {plan.period && (
                    <span
                      className={`text-[14px] font-medium ${
                        plan.popular ? 'text-white/40' : 'text-[var(--lp-faint)]'
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1.5 text-[13px] ${
                    plan.popular ? 'text-white/45' : 'text-[var(--lp-faint)]'
                  }`}
                >
                  {plan.detail}
                </p>

                <div
                  className={`my-6 h-px ${
                    plan.popular ? 'bg-white/10' : 'bg-[var(--lp-line)]'
                  }`}
                />

                <ul className="flex flex-1 flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px]">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          plan.popular
                            ? 'bg-white/10 text-[#A5B4FC]'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        <IconCheck size={12} stroke={2.5} />
                      </span>
                      <span
                        className={
                          plan.popular ? 'text-white/75' : 'text-[var(--lp-muted)]'
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`mt-8 block w-full rounded-full py-3 text-center text-[14px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 ${
                    plan.popular
                      ? 'bg-white text-[var(--lp-ink)] shadow-sm hover:bg-zinc-100'
                      : 'border border-[var(--lp-line-strong)] bg-white text-[var(--lp-ink)] hover:border-[var(--lp-ink)]/20 hover:bg-zinc-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <FadeIn delay={0.1}>
        <p className="mt-10 text-center text-[13px] text-[var(--lp-faint)]">
          No credit card required for Starter · Cancel anytime on Pro
        </p>
      </FadeIn>
    </Section>
  )
}
