'use client'

import { FadeIn, Section, Stagger, StaggerItem } from './ui.tsx'

const SIGNALS = [
  { value: '$0', label: 'Overage on blocked calls', detail: 'Provider never charged' },
  { value: '429', label: 'Hard budget response', detail: 'Before the provider hop' },
  { value: '1-line', label: 'Integration', detail: 'Swap baseURL + virtual key' },
  { value: '3', label: 'Providers out of the box', detail: 'OpenAI · Anthropic · Gemini' },
]

export function SignalStrip() {
  return (
    <Section className="pb-8 pt-4 sm:pb-12">
      <FadeIn>
        <div className="overflow-hidden rounded-[28px] border border-[var(--lp-line)] bg-white shadow-[var(--lp-card-shadow)]">
          <Stagger className="grid divide-y divide-[var(--lp-line)] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
            {SIGNALS.map((s, i) => (
              <StaggerItem key={s.label}>
                <div
                  className={`h-full px-6 py-8 sm:px-7 ${
                    i % 2 === 0 ? 'sm:border-r sm:border-[var(--lp-line)]' : ''
                  } ${i < 3 ? 'lg:border-r lg:border-[var(--lp-line)]' : 'lg:border-r-0'} ${
                    i === 1 ? 'sm:border-r-0 lg:border-r' : ''
                  }`}
                >
                  <p className="lp-mono text-[28px] font-semibold tracking-tight text-[var(--lp-ink)] sm:text-[32px]">
                    {s.value}
                  </p>
                  <p className="mt-2 text-[14px] font-medium text-[var(--lp-ink)]">{s.label}</p>
                  <p className="mt-1 text-[13px] text-[var(--lp-muted)]">{s.detail}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </FadeIn>
    </Section>
  )
}
