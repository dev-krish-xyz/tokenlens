'use client'

import { useId, useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { FadeIn, Section, SectionLabel, SectionSub, SectionTitle } from './ui.tsx'

const ITEMS = [
  {
    q: 'Do you store my provider API keys?',
    a: 'Provider secrets are encrypted with AES-256-GCM at rest and decrypted only per request. They are never written to logs or ClickHouse. Virtual keys (tl-vk-…) are what your apps see.',
  },
  {
    q: 'How does hard budget blocking work?',
    a: 'Before the provider call, the gateway atomically reserves spend against the key and workspace caps. Over-cap traffic returns HTTP 429 and never reaches OpenAI, Anthropic, or Gemini — so blocked calls cost $0.',
  },
  {
    q: 'Does streaming work?',
    a: 'Yes. Stream and JSON both flow through the same OpenAI-compatible path. Budgets still enforce pre-call; usage is costed asynchronously after the response.',
  },
  {
    q: 'Which providers are supported?',
    a: 'OpenAI, Anthropic, and Gemini today. Point your existing SDK at the TokenLens gateway and attach a virtual key bound to that provider.',
  },
  {
    q: 'What happens when I hit the budget?',
    a: 'The request is rejected at the gateway with HTTP 429. Your app can retry later or route elsewhere — the provider is never billed for the blocked call.',
  },
  {
    q: 'Is there a free tier?',
    a: 'Starter is free forever for light governance. Pro adds a 30-day trial with unlimited governed spend, full providers, and advanced analytics.',
  },
] as const

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  const baseId = useId()

  return (
    <Section id="faq" className="py-20 sm:py-24 lg:py-28">
      <FadeIn>
        <SectionLabel>08 — FAQ</SectionLabel>
        <SectionTitle>Questions teams ask first.</SectionTitle>
        <SectionSub>
          Straight answers on keys, blocking, streaming, and pricing — before you wire the gateway.
        </SectionSub>
      </FadeIn>

      <div className="mx-auto mt-12 max-w-2xl divide-y divide-[var(--lp-line)] rounded-[var(--lp-radius-card)] border border-[var(--lp-line)] bg-white shadow-[var(--lp-card-shadow)]">
        {ITEMS.map((item, i) => {
          const isOpen = open === i
          const panelId = `${baseId}-panel-${i}`
          const btnId = `${baseId}-btn-${i}`
          return (
            <div key={item.q}>
              <h3>
                <button
                  type="button"
                  id={btnId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-zinc-50/80 sm:px-6 sm:py-5"
                >
                  <span className="text-[15px] font-semibold tracking-tight text-[var(--lp-ink)]">
                    {item.q}
                  </span>
                  <IconChevronDown
                    size={18}
                    className={`shrink-0 text-[var(--lp-faint)] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                hidden={!isOpen}
                className="px-5 pb-5 sm:px-6 sm:pb-6"
              >
                <p className="text-[14px] leading-relaxed text-[var(--lp-muted)]">{item.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
