'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import {
  IconBell,
  IconChartLine,
  IconFileText,
  IconShieldLock,
  IconUsers,
} from '@tabler/icons-react'
import { FadeIn, Section, SectionLabel, SectionSub, SectionTitle } from './ui.tsx'
import { easeOutExpo } from '../lib/motion.ts'
import { FEATURE_DEMOS, type FeatureId } from './demos/index.ts'

const FEATURES: Array<{
  id: FeatureId
  icon: typeof IconShieldLock
  title: string
  body: string
}> = [
  {
    id: 'budget',
    icon: IconShieldLock,
    title: 'Hard budget enforcement',
    body: 'Block requests at the gateway before they reach your provider. HTTP 429 — $0 overage by design.',
  },
  {
    id: 'margin',
    icon: IconUsers,
    title: 'Per-customer margins',
    body: 'Pass X-TL-User-Id to see exactly how much AI each customer costs versus plan revenue.',
  },
  {
    id: 'alerts',
    icon: IconBell,
    title: 'Budget & anomaly alerts',
    body: 'Threshold sweeps and anomaly fan-out — webhook or email, with cooldown dedup so you are not spammed.',
  },
  {
    id: 'logs',
    icon: IconFileText,
    title: 'Request cost logs',
    body: 'Every call costed into ClickHouse asynchronously — model, tokens, latency, virtual key — without blocking the LLM path.',
  },
  {
    id: 'forecast',
    icon: IconChartLine,
    title: 'Spend forecasting',
    body: '30-day projections with anomaly markers. Know the trajectory before you hit the wall.',
  },
]

/** Time on each feature before auto-advance (was 5.2s — felt stuck). */
const AUTO_MS = 3400

export function FeatureBento() {
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { amount: 0.2, once: false })
  const [active, setActive] = useState<FeatureId>('budget')
  /** Only pause while hovering the option list — not the whole section/demo. */
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reduce || !inView || paused) return
    const id = window.setInterval(() => {
      setActive((cur) => {
        const i = FEATURES.findIndex((f) => f.id === cur)
        const next = i < 0 ? 0 : (i + 1) % FEATURES.length
        return FEATURES[next]!.id
      })
    }, AUTO_MS)
    return () => window.clearInterval(id)
  }, [reduce, inView, paused])

  const current = FEATURES.find((f) => f.id === active) ?? FEATURES[0]!
  const Demo = FEATURE_DEMOS[active]

  return (
    <Section className="py-20 sm:py-24 lg:py-28">
      <FadeIn>
        <SectionLabel>04 — Intelligence</SectionLabel>
        <SectionTitle>
          After the block —
          <br className="hidden sm:block" /> still operate.
        </SectionTitle>
        <SectionSub>
          Budgets, margins, alerts, logs, and forecasts — each as a live demo,
          not a static icon card.
        </SectionSub>
      </FadeIn>

      <div
        ref={sectionRef}
        className="mt-14 grid items-stretch gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]"
      >
        <FadeIn delay={0.05}>
          <div
            className="flex flex-col gap-2"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setPaused(false)
              }
            }}
          >
            {FEATURES.map((f) => {
              const Icon = f.icon
              const isOn = f.id === active
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActive(f.id)}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 sm:p-5 ${
                    isOn
                      ? 'border-[#6366F1]/30 bg-white shadow-[0_0_0_1px_rgba(99,102,241,0.1),var(--lp-card-shadow)]'
                      : 'border-transparent bg-zinc-50/80 hover:border-[var(--lp-line)] hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isOn
                          ? 'bg-[#EEF2FF] text-[#4F46E5]'
                          : 'bg-zinc-100 text-[var(--lp-ink)]'
                      }`}
                    >
                      <Icon size={18} stroke={1.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={`text-[14px] font-semibold tracking-tight sm:text-[15px] ${
                            isOn ? 'text-[var(--lp-ink)]' : 'text-[var(--lp-ink)]/80'
                          }`}
                        >
                          {f.title}
                        </h3>
                      </div>
                      <p
                        className={`mt-1 text-[13px] leading-relaxed ${
                          isOn ? 'text-[var(--lp-muted)]' : 'text-[var(--lp-faint)]'
                        }`}
                      >
                        {f.body}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="relative h-full min-h-[420px] overflow-hidden rounded-[24px] border border-[var(--lp-line)] bg-[var(--lp-dark)] shadow-[var(--lp-card-shadow)] sm:min-h-[480px]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.1), transparent 55%)',
              }}
            />
            <div className="relative flex h-full flex-col p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  Live demo · {current.title}
                </p>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-white/50">
                  Auto-play
                </span>
              </div>

              <div className="relative min-h-0 flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    className="absolute inset-0"
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                    transition={{ duration: 0.35, ease: easeOutExpo }}
                  >
                    <Demo />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </Section>
  )
}
