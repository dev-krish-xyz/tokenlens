'use client'

import { IconArrowRight, IconPlayerPlay } from '@tabler/icons-react'
import { motion, useReducedMotion } from 'framer-motion'
import { ProductStage } from '../mocks/ProductStage.tsx'
import { easeOutExpo, lineReveal, staggerContainer } from '../lib/motion.ts'
import { PrimaryButton, SecondaryButton } from './ui.tsx'

const LINES = ['Stop overpaying for AI.', 'Block spend before the call.']

export function Hero() {
  const reduce = useReducedMotion()

  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-32 lg:pt-36">
      {/* atmosphere */}
      <div aria-hidden className="lp-mesh absolute inset-0 -z-20" />
      <div aria-hidden className="lp-grid absolute inset-0 -z-10 opacity-80" />
      <div aria-hidden className="lp-noise absolute inset-0 -z-10" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* centered copy */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--lp-line)] bg-white/70 px-3.5 py-1.5 text-[13px] font-medium text-[var(--lp-ink)] shadow-sm backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6366F1] opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6366F1]" />
            </span>
            Public beta · free for 30 days
          </motion.div>

          {reduce ? (
            <h1 className="lp-display text-[var(--lp-ink)]">
              {LINES.map((line) => (
                <span key={line} className="block">
                  {line.includes('before') ? (
                    <>
                      Block spend{' '}
                      <span className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] bg-clip-text text-transparent">
                        before
                      </span>{' '}
                      the call.
                    </>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </h1>
          ) : (
            <motion.h1
              className="lp-display text-[var(--lp-ink)]"
              initial="hidden"
              animate="show"
              variants={staggerContainer}
            >
              {LINES.map((line) => (
                <motion.span key={line} className="block" variants={lineReveal}>
                  {line.includes('before') ? (
                    <>
                      Block spend{' '}
                      <span className="bg-gradient-to-r from-[#6366F1] to-[#4F46E5] bg-clip-text text-transparent">
                        before
                      </span>{' '}
                      the call.
                    </>
                  ) : (
                    line
                  )}
                </motion.span>
              ))}
            </motion.h1>
          )}

          <motion.p
            className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-[var(--lp-muted)] sm:text-[18px]"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: easeOutExpo }}
          >
            TokenLens is the AI cost governance control plane. Hard-block
            over-budget requests at the gateway — before they hit OpenAI,
            Anthropic, or Gemini.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease: easeOutExpo }}
          >
            <PrimaryButton href="/register">
              Start free
              <IconArrowRight size={16} />
            </PrimaryButton>
            <SecondaryButton
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <IconPlayerPlay size={15} />
              Watch the block
            </SecondaryButton>
          </motion.div>

          <motion.p
            className="lp-mono mt-6 text-[12px] text-[var(--lp-faint)]"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            HTTP 429 · $0 wasted on blocked requests
          </motion.p>
        </div>

        {/* product stage */}
        <motion.div
          className="mt-14 sm:mt-16 lg:mt-20"
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.25, ease: easeOutExpo }}
        >
          <ProductStage />
        </motion.div>
      </div>
    </section>
  )
}
