'use client'

import {
  IconEyeOff,
  IconKey,
  IconLock,
  IconShieldCheck,
} from '@tabler/icons-react'
import { FadeIn, Section, SectionLabel, SectionSub, SectionTitle, Stagger, StaggerItem } from './ui.tsx'

const PILLARS = [
  {
    icon: IconKey,
    title: 'Encrypted virtual keys',
    body: 'Provider secrets sealed with AES-256-GCM. Decrypted per request — never written to logs.',
  },
  {
    icon: IconEyeOff,
    title: 'No secret leakage',
    body: 'ClickHouse stores hashed key digests, not raw tl-vk tokens. Upstream errors stay generic.',
  },
  {
    icon: IconShieldCheck,
    title: 'SSRF-guarded edges',
    body: 'Request validation and alert webhooks resolve DNS and block private IPs before egress.',
  },
  {
    icon: IconLock,
    title: 'Atomic spend control',
    body: 'Budget reserve uses atomic counters. Over-cap traffic never reaches the provider hop.',
  },
]

export function SecurityStrip() {
  return (
    <Section className="py-20 sm:py-24 lg:py-28">
      <FadeIn>
        <SectionLabel>05 — Trust</SectionLabel>
        <SectionTitle>
          Built like infrastructure,
          <br className="hidden sm:block" /> not a toy dashboard.
        </SectionTitle>
        <SectionSub>
          Finance and platform teams need control without credential risk.
          Security is structural — not a checklist slide.
        </SectionSub>
      </FadeIn>

      <Stagger className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <StaggerItem key={p.title}>
            <div className="lp-card h-full p-5 sm:p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--lp-line)] bg-zinc-50 text-[var(--lp-ink)]">
                <p.icon size={18} stroke={1.5} />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-[var(--lp-ink)]">
                {p.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--lp-muted)]">{p.body}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <FadeIn delay={0.08} className="mt-10">
        <blockquote className="lp-card relative overflow-hidden px-6 py-7 sm:px-10 sm:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-1 top-6 bottom-6 w-1 rounded-full bg-[var(--lp-ink)]/15"
          />
          <p className="text-[17px] font-medium leading-snug tracking-[-0.02em] text-[var(--lp-ink)] sm:text-[19px]">
            “We stopped treating AI invoices as weather. Hard caps at the gateway
            meant finance finally trusted the roadmap.”
          </p>
          <footer className="mt-5 flex flex-wrap items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-[12px] font-semibold text-[var(--lp-ink)]">
              PL
            </span>
            <div>
              <p className="text-[13px] font-semibold text-[var(--lp-ink)]">Platform lead</p>
              <p className="text-[12px] text-[var(--lp-faint)]">
                Series B · multi-provider AI product
              </p>
            </div>
          </footer>
        </blockquote>
      </FadeIn>
    </Section>
  )
}
