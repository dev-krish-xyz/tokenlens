'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import {
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconLock,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react'
import { FadeIn, Section, SectionLabel, SectionSub, SectionTitle } from './ui.tsx'
import { easeOutExpo } from '../lib/motion.ts'
import { useDemoLoop } from '../lib/useDemoLoop.ts'

type StepRole = 'pass' | 'block' | 'skip'

type Step = {
  id: string
  index: string
  label: string
  title: string
  detail: string
  role: StepRole
}

const STEPS: Step[] = [
  {
    id: 'app',
    index: '00',
    label: 'Your App',
    title: 'Request enters the gateway',
    detail: 'Client hits gateway.tokenlens.ai with a virtual key header.',
    role: 'pass',
  },
  {
    id: 'rl',
    index: '01',
    label: 'rateLimiter',
    title: 'Sliding-window rate limit',
    detail: 'Per-IP window check in DragonflyDB. Soft throttle before spend.',
    role: 'pass',
  },
  {
    id: 'rv',
    index: '02',
    label: 'requestValidator',
    title: 'Shape + SSRF guard',
    detail: 'Zod body validation and blocked private-IP targets.',
    role: 'pass',
  },
  {
    id: 'kr',
    index: '03',
    label: 'keyResolver',
    title: 'Virtual key resolved',
    detail: 'Cache hit or Postgres decrypt. Provider key never logged.',
    role: 'pass',
  },
  {
    id: 'be',
    index: '04',
    label: 'budgetEnforcer',
    title: 'Hard budget check',
    detail: 'Atomic INCRBYFLOAT reserve. Over budget → 429 before proxy.',
    role: 'block',
  },
  {
    id: 'pp',
    index: '05',
    label: 'providerProxy',
    title: 'Provider call',
    detail: 'Only reached when budget allows. OpenAI / Anthropic / Gemini.',
    role: 'skip',
  },
  {
    id: 'log',
    index: '06',
    label: 'logAsync',
    title: 'Async cost log',
    detail: 'Non-blocking push to the ingestion queue → ClickHouse.',
    role: 'skip',
  },
]

export function GatewayChapter() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.3 })
  const pausedRef = useRef(false)

  const [active, setActive] = useState(reduce ? 4 : 0)
  const [blocked, setBlocked] = useState(!!reduce)

  useEffect(() => {
    pausedRef.current = !inView
  }, [inView])

  useDemoLoop(
    async ({ wait, cancelled, waitWhilePaused }) => {
      while (!cancelled()) {
        await waitWhilePaused()
        if (cancelled()) break

        let i = 0
        setBlocked(false)
        setActive(0)
        await wait(500)
        if (cancelled()) break

        while (i < STEPS.length && !cancelled()) {
          await waitWhilePaused()
          if (cancelled()) break

          const step = STEPS[i]!
          setActive(i)

          if (step.role === 'block') {
            setBlocked(true)
            await wait(2200)
            i = STEPS.length
            await wait(1600)
            break
          }

          await wait(720)
          i += 1
        }

        await wait(600)
      }
    },
    [],
    {
      reduce,
      pausedRef,
      onReduce: () => {
        setActive(4)
        setBlocked(true)
      },
    },
  )

  const current = STEPS[Math.min(active, STEPS.length - 1)]!

  return (
    <Section id="how-it-works" dark className="overflow-hidden py-20 sm:py-24 lg:py-28">
      {/* Quiet dark atmosphere — no loud purple wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.04), transparent 50%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 40%, black, transparent)',
        }}
      />

      <div className="relative">
        <FadeIn>
          <SectionLabel light>02 — The control plane</SectionLabel>
          <SectionTitle light>
            A gateway that
            <br className="hidden sm:block" /> refuses to waste money.
          </SectionTitle>
          <SectionSub light>
            Every request walks the same middleware chain — in order. Budget is
            enforced before the provider call, so blocked traffic costs nothing.
          </SectionSub>
        </FadeIn>

        <FadeIn delay={0.08} className="mt-12">
          <div
            ref={ref}
            className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset]"
          >
            {/* Panel chrome */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                </div>
                <p className="lp-mono text-[11px] text-white/35">
                  middleware · enforced in order
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    blocked ? 'bg-white/80' : 'bg-white/30'
                  }`}
                />
                <span className="text-[11px] font-medium text-white/40">
                  {blocked ? 'Budget exceeded' : 'Request in flight'}
                </span>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              {/* Step list */}
              <div className="border-b border-white/[0.06] p-4 sm:p-5 lg:border-b-0 lg:border-r">
                <ol className="flex flex-col gap-1">
                  {STEPS.map((step, index) => {
                    const isActive = active === index && !(blocked && step.role === 'skip')
                    const isPast = active > index && !(blocked && step.role === 'skip')
                    const isSkipped = blocked && step.role === 'skip'
                    const isBlockStep = step.role === 'block' && blocked

                    return (
                      <li key={step.id}>
                        <div
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-300 ${
                            isActive
                              ? 'bg-white/[0.07]'
                              : isSkipped
                                ? 'opacity-35'
                                : 'opacity-70'
                          }`}
                        >
                          {/* Index / status mark */}
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-medium transition-colors duration-300 ${
                              isBlockStep
                                ? 'border-white/25 bg-white text-[var(--lp-dark)]'
                                : isActive
                                  ? 'border-white/20 bg-white/10 text-white'
                                  : isPast && !isSkipped
                                    ? 'border-white/10 bg-white/[0.04] text-white/50'
                                    : 'border-white/[0.06] bg-transparent text-white/30'
                            }`}
                          >
                            {isBlockStep ? (
                              <IconX size={12} stroke={2.5} />
                            ) : isPast && !isSkipped && !isActive ? (
                              <IconCheck size={12} stroke={2} />
                            ) : (
                              <span className="lp-mono">{step.index}</span>
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`lp-mono truncate text-[12px] font-medium sm:text-[13px] ${
                                isSkipped
                                  ? 'text-white/30 line-through'
                                  : isActive
                                    ? 'text-white'
                                    : 'text-white/55'
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>

                          {isActive && (
                            <motion.span
                              layoutId="gw-active-dot"
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-white"
                              transition={{ duration: 0.25, ease: easeOutExpo }}
                            />
                          )}
                          {isSkipped && (
                            <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">
                              skipped
                            </span>
                          )}
                        </div>

                        {/* Connector */}
                        {index < STEPS.length - 1 && (
                          <div className="ml-[22px] h-2 w-px bg-white/[0.06]" />
                        )}
                      </li>
                    )
                  })}
                </ol>
              </div>

              {/* Detail pane */}
              <div className="flex flex-col justify-between p-5 sm:p-7">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/30">
                    Current step
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current.id + String(blocked)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.28, ease: easeOutExpo }}
                      className="mt-3"
                    >
                      <p className="lp-mono text-[12px] text-white/40">{current.label}</p>
                      <h3 className="mt-1 text-[20px] font-semibold tracking-tight text-white sm:text-[22px]">
                        {blocked && current.role === 'block'
                          ? 'Request rejected'
                          : current.title}
                      </h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-white/45">
                        {blocked && current.role === 'block'
                          ? 'Budget cap hit. Provider proxy and async log still queue the rejection — spend never leaves the gate.'
                          : current.detail}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Outcome card */}
                <div
                  className={`mt-8 rounded-2xl border px-4 py-4 transition-colors duration-500 sm:px-5 ${
                    blocked
                      ? 'border-white/15 bg-white/[0.06]'
                      : 'border-white/[0.06] bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                          blocked
                            ? 'border-white/20 bg-white text-[var(--lp-dark)]'
                            : 'border-white/10 bg-white/5 text-white/50'
                        }`}
                      >
                        {blocked ? (
                          <IconShieldCheck size={16} stroke={1.5} />
                        ) : (
                          <IconBolt size={16} stroke={1.5} />
                        )}
                      </span>
                      <div>
                        <p
                          className={`lp-mono text-[13px] font-medium ${
                            blocked ? 'text-white' : 'text-white/40'
                          }`}
                        >
                          {blocked
                            ? 'HTTP 429 · Budget exceeded'
                            : 'Walking the chain…'}
                        </p>
                        <p className="mt-1 text-[12px] text-white/35">
                          {blocked
                            ? 'provider never called · $0 charged'
                            : 'rate → validate → resolve → enforce → proxy'}
                        </p>
                      </div>
                    </div>
                    {blocked && (
                      <span className="lp-mono shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70">
                        $0
                      </span>
                    )}
                  </div>

                  {blocked && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                      {[
                        { icon: IconLock, text: 'Atomic reserve' },
                        { icon: IconX, text: 'Reject pre-proxy' },
                        { icon: IconArrowRight, text: 'Provider skipped' },
                      ].map((chip) => (
                        <span
                          key={chip.text}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/45"
                        >
                          <chip.icon size={12} stroke={1.5} />
                          {chip.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom progress rail */}
            <div className="border-t border-white/[0.06] px-5 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-white/50"
                    animate={{
                      width: `${((Math.min(active, 4) + 1) / 5) * 100}%`,
                    }}
                    transition={{ duration: 0.4, ease: easeOutExpo }}
                  />
                </div>
                <span className="lp-mono shrink-0 text-[10px] text-white/30">
                  {blocked ? 'halted @ 04' : `step ${String(active).padStart(2, '0')}`}
                </span>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Principle strip */}
        <FadeIn delay={0.12}>
          <p className="mt-8 text-center text-[13px] text-white/35">
            Same path every request · budget before proxy · async logs never block
          </p>
        </FadeIn>
      </div>
    </Section>
  )
}
