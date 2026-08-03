'use client'

import { IconArrowRight, IconPlayerPlay } from '@tabler/icons-react'
import { motion, useReducedMotion } from 'framer-motion'
import { ProductStage } from '../mocks/ProductStage.tsx'
import { easeOutExpo, lineReveal, staggerContainer } from '../lib/motion.ts'
import { PrimaryButton, SecondaryButton } from './ui.tsx'

const LINES = [
  { text: 'AI spend ends here.', accent: null as string | null },
  {
    text: 'Hard-block over-budget calls before the provider.',
    accent: 'before',
  },
]

const PROOF = [
  { value: 'HTTP 429', label: 'pre-provider' },
  { value: '$0', label: 'charged on block' },
  { value: '3', label: 'providers' },
]

export function Hero() {
  const reduce = useReducedMotion()

  return (
    <section className="relative isolate overflow-hidden pb-14 pt-28 sm:pb-20 sm:pt-32 lg:pb-24 lg:pt-36">
      {/* Hero background — full control-plane field (previous build) */}
      <div aria-hidden className="lp-hero-bg">
        <div className="lp-hero-mesh" />
        <div className="lp-hero-orb lp-hero-orb-a" />
        <div className="lp-hero-orb lp-hero-orb-b" />
        <div className="lp-hero-orb lp-hero-orb-c" />
        <div className="lp-hero-orb lp-hero-orb-d" />
        <div className="lp-hero-grid" />
        <div className="lp-hero-dots" />
        <div className="lp-hero-spotlight" />
        <div className="lp-hero-vignette" />
        <div className="lp-hero-horizon" />
        <div className="lp-hero-grain" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--lp-line)] bg-white/80 px-3.5 py-1.5 text-[12px] font-medium text-[var(--lp-ink)] shadow-sm backdrop-blur sm:text-[13px]"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6366F1]" />
            <span className="text-[var(--lp-muted)]">
              Hard budgets · pre-provider · OpenAI · Anthropic · Gemini
            </span>
          </motion.div>

          {reduce ? (
            <h1 className="lp-display tracking-[-0.04em] text-[var(--lp-ink)]">
              {LINES.map((line) => (
                <span key={line.text} className="block">
                  <HeadlineLine line={line} />
                </span>
              ))}
            </h1>
          ) : (
            <motion.h1
              className="lp-display tracking-[-0.04em] text-[var(--lp-ink)]"
              initial="hidden"
              animate="show"
              variants={staggerContainer}
            >
              {LINES.map((line) => (
                <motion.span key={line.text} className="block" variants={lineReveal}>
                  <HeadlineLine line={line} />
                </motion.span>
              ))}
            </motion.h1>
          )}

          <motion.p
            className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-[var(--lp-muted)] sm:text-[18px]"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: easeOutExpo }}
          >
            TokenLens is the AI cost governance gateway. Atomic budget checks on
            every request — $0 charged when blocked.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-col items-center gap-3"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26, ease: easeOutExpo }}
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <PrimaryButton href="/register">
                Start free
                <IconArrowRight size={16} />
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  document
                    .getElementById('hero-stage')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              >
                <IconPlayerPlay size={15} />
                See the 429
              </SecondaryButton>
            </div>
            <p className="text-[12px] text-[var(--lp-faint)]">
              30 days free · Starter stays free forever
            </p>
          </motion.div>

          {/* Proof metrics — large type, monochrome (Photon-style scale) */}
          <motion.ul
            className="mx-auto mt-12 flex max-w-lg items-stretch justify-center divide-x divide-[var(--lp-line-strong)] sm:max-w-xl"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.34, ease: easeOutExpo }}
          >
            {PROOF.map((p) => (
              <li key={p.value} className="min-w-0 flex-1 px-4 py-1 text-center sm:px-6">
                <p className="lp-mono text-[22px] font-semibold tracking-[-0.03em] text-[var(--lp-ink)] sm:text-[28px]">
                  {p.value}
                </p>
                <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--lp-faint)] sm:text-[11px]">
                  {p.label}
                </p>
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          id="hero-stage"
          className="mt-12 scroll-mt-28 sm:mt-14 lg:mt-16"
          initial={reduce ? false : { opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.32, ease: easeOutExpo }}
        >
          <ProductStage />
          <p className="lp-mono mt-4 text-center text-[11px] text-[var(--lp-faint)] sm:text-[12px]">
            Live demo · budget enforcer · OpenAI · Anthropic · Gemini · $0 overage
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function HeadlineLine({
  line,
}: {
  line: { text: string; accent: string | null }
}) {
  if (!line.accent || !line.text.includes(line.accent)) {
    return <>{line.text}</>
  }
  const [before, after] = line.text.split(line.accent)
  return (
    <>
      {before}
      <span className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] bg-clip-text text-transparent">
        {line.accent}
      </span>
      {after}
    </>
  )
}
