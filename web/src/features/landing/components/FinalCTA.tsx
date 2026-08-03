'use client'

import { IconArrowRight } from '@tabler/icons-react'
import { FadeIn, PrimaryButton, SecondaryButton, Section } from './ui.tsx'

export function FinalCTA() {
  return (
    <Section wide className="pb-20 sm:pb-24 lg:pb-28">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[32px] bg-[var(--lp-dark)] px-6 py-16 text-center sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 80% at 50% 120%, rgba(99,102,241,0.45), transparent 55%), radial-gradient(ellipse 40% 40% at 20% 0%, rgba(99,102,241,0.12), transparent 50%)',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />
          <div className="relative">
            <p className="lp-micro text-white/40">Ready when you are</p>
            <h2 className="lp-h2 mt-4 text-white">
              Govern every token
              <br className="hidden sm:block" /> before it costs you.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-white/50">
              Spin up a workspace, create a virtual key, and put a hard ceiling
              on AI spend in minutes.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <PrimaryButton
                href="/register"
                className="!bg-white !text-[var(--lp-ink)] !shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:!bg-zinc-100"
              >
                Start free
                <IconArrowRight size={16} />
              </PrimaryButton>
              <SecondaryButton
                href="/login"
                className="!border-white/15 !bg-white/5 !text-white hover:!bg-white/10"
              >
                Sign in
              </SecondaryButton>
            </div>
            <p className="mt-5 text-[13px] text-white/40">
              Free Starter · no card required · hard budgets from day one
            </p>
          </div>
        </div>
      </FadeIn>
    </Section>
  )
}
