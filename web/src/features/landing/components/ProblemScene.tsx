'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import {
  IconArrowRight,
  IconBan,
  IconCloud,
  IconReceipt,
  IconServer,
  IconShieldLock,
} from '@tabler/icons-react'
import { FadeIn, Section, SectionLabel, SectionSub, SectionTitle } from './ui.tsx'
import { MacWindow } from './MacWindow.tsx'
import { easeOutExpo } from '../lib/motion.ts'
import { useDemoLoop } from '../lib/useDemoLoop.ts'

/**
 * 01 — Dual Mac-window path theaters, muted palette.
 */
export function ProblemScene() {
  return (
    <Section id="product" className="py-20 sm:py-24 lg:py-28">
      <FadeIn>
        <SectionLabel>01 — The problem</SectionLabel>
        <SectionTitle>
          The invoice arrives
          <br className="hidden sm:block" /> too late.
        </SectionTitle>
        <SectionSub>
          Watch the same request twice. Without a gateway, spend escapes.
          With TokenLens, it never reaches the provider.
        </SectionSub>
      </FadeIn>

      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <FadeIn delay={0.04}>
          <PathTheater mode="without" />
        </FadeIn>
        <FadeIn delay={0.1}>
          <PathTheater mode="with" />
        </FadeIn>
      </div>

      <FadeIn delay={0.12}>
        <blockquote className="mx-auto mt-16 max-w-2xl text-center">
          <p className="text-[22px] font-medium leading-snug tracking-[-0.02em] text-[var(--lp-ink)] sm:text-[26px]">
            “Dashboards report damage.
            <br />
            Gateways prevent it.”
          </p>
          <footer className="mt-4 text-[13px] text-[var(--lp-faint)]">
            Product principle · TokenLens
          </footer>
        </blockquote>
      </FadeIn>
    </Section>
  )
}

type Phase = 0 | 1 | 2 | 3 | 4

function PathTheater({ mode }: { mode: 'without' | 'with' }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const pausedRef = useRef(false)

  const [phase, setPhase] = useState<Phase>(0)
  const [invoice, setInvoice] = useState(0)
  const [blocked, setBlocked] = useState(0)

  useEffect(() => {
    pausedRef.current = !inView
  }, [inView])

  useDemoLoop(
    async ({ wait, cancelled, waitWhilePaused }) => {
      let inv = 0
      let blk = 0
      while (!cancelled()) {
        await waitWhilePaused()
        if (cancelled()) break

        setPhase(0)
        await wait(600)
        if (cancelled()) break

        setPhase(1)
        await wait(800)
        if (cancelled()) break

        if (mode === 'without') {
          setPhase(2)
          await wait(700)
          if (cancelled()) break
          setPhase(3)
          inv += 180 + Math.round(Math.random() * 220)
          setInvoice(inv)
          await wait(1000)
          if (cancelled()) break
          setPhase(4)
          await wait(1800)
        } else {
          setPhase(2)
          await wait(800)
          if (cancelled()) break
          setPhase(3)
          blk += 1
          setBlocked(blk)
          await wait(1000)
          if (cancelled()) break
          setPhase(4)
          await wait(1800)
        }
      }
    },
    [mode],
    {
      reduce,
      pausedRef,
      onReduce: () => {
        setPhase(4)
        if (mode === 'without') setInvoice(12840)
        else setBlocked(47)
      },
    },
  )

  const isWithout = mode === 'without'
  const title = isWithout ? 'without.tokenlens' : 'with.tokenlens'
  const subtitle = isWithout ? 'Direct to provider' : 'Gateway in the path'

  return (
    <div ref={ref}>
      <MacWindow
        title={title}
        footer={
          <>
            <span className="lp-mono">{isWithout ? 'path · direct' : 'path · gateway'}</span>
            <span className="lp-mono">live simulation</span>
          </>
        }
      >
      {/* Toolbar / status */}
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] bg-[#FAFAFA] px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[var(--lp-ink)]">
            {isWithout ? 'Without TokenLens' : 'With TokenLens'}
          </p>
          <p className="truncate text-[11px] text-[var(--lp-faint)]">{subtitle}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
            isWithout
              ? 'border-black/[0.06] bg-white text-[var(--lp-muted)]'
              : 'border-[var(--lp-ink)]/10 bg-[var(--lp-ink)] text-white'
          }`}
        >
          {isWithout ? 'Uncontrolled' : 'Governed'}
        </span>
      </div>

      {/* Dashboard body */}
      <div className="bg-white">
        {/* Pipeline stage */}
        <div className="relative border-b border-[var(--lp-line)] px-4 py-8 sm:px-6">
          <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--lp-faint)]">
            Request path
          </p>
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <Node
              active={phase >= 1}
              done={phase > 1}
              icon={<IconServer size={16} stroke={1.5} />}
              label="App"
            />
            <Pipe lit={phase >= 1} muted={isWithout && phase >= 3} blocked={!isWithout && phase >= 3} />

            {isWithout ? (
              <>
                <Node
                  active={phase >= 2}
                  done={phase > 2}
                  icon={<IconCloud size={16} stroke={1.5} />}
                  label="Provider"
                />
                <Pipe lit={phase >= 3} muted />
                <Node
                  active={phase >= 3}
                  done={phase >= 4}
                  emphasis={phase >= 3}
                  icon={<IconReceipt size={16} stroke={1.5} />}
                  label="Invoice"
                />
              </>
            ) : (
              <>
                <Node
                  active={phase >= 2}
                  done={phase > 2}
                  icon={<IconShieldLock size={16} stroke={1.5} />}
                  label="Budget"
                />
                <Pipe lit={phase >= 3} blocked={phase >= 3} />
                <Node
                  active={phase >= 3}
                  done={phase >= 4}
                  emphasis={phase >= 3}
                  icon={<IconBan size={16} stroke={1.5} />}
                  label="Block"
                />
              </>
            )}
          </div>

          <AnimatePresence>
            {phase >= 1 && phase < 4 && !reduce && (
              <motion.div
                key={`${mode}-${phase}`}
                className="pointer-events-none absolute left-0 right-0 top-[68px] hidden h-2 sm:block"
                initial={false}
              >
                <motion.div
                  className="absolute top-0 h-2 w-2 rounded-full bg-[var(--lp-ink)]/70"
                  initial={{ left: '10%', opacity: 0, scale: 0.5 }}
                  animate={{
                    left: phase === 1 ? '30%' : phase === 2 ? '54%' : '78%',
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.55, ease: easeOutExpo }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Metric panel */}
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-[var(--lp-line)] px-4 py-5 sm:border-b-0 sm:border-r sm:px-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--lp-faint)]">
              {isWithout ? 'Surprise invoice' : 'Blocked requests'}
            </p>
            <p className="lp-mono mt-1.5 text-[28px] font-semibold tracking-tight tabular-nums text-[var(--lp-ink)] sm:text-[30px]">
              {isWithout ? (
                <>
                  ${invoice.toLocaleString()}
                  <span className="text-[12px] font-medium text-[var(--lp-faint)]">
                    {' '}
                    this month
                  </span>
                </>
              ) : (
                <>
                  {blocked}
                  <span className="text-[12px] font-medium text-[var(--lp-faint)]">
                    {' '}
                    · $0 charged
                  </span>
                </>
              )}
            </p>
            <p className="mt-3 text-[12px] leading-relaxed text-[var(--lp-muted)]">
              {isWithout
                ? 'Every request hits the provider first. Cost shows up in finance reviews — hours later.'
                : 'Over-budget calls die at the gateway with HTTP 429. The provider is never called.'}
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 bg-[#FAFAFA] px-4 py-5 sm:px-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--lp-faint)]">Status</span>
              <StatusPill phase={phase} mode={mode} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--lp-faint)]">Provider call</span>
              <span className="lp-mono text-[11px] font-medium text-[var(--lp-ink)]">
                {isWithout
                  ? phase >= 2
                    ? 'Yes'
                    : '—'
                  : phase >= 3
                    ? 'Never'
                    : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--lp-faint)]">Cost impact</span>
              <span className="lp-mono text-[11px] font-medium text-[var(--lp-ink)]">
                {isWithout ? (phase >= 3 ? 'Charged' : '—') : phase >= 3 ? '$0.00' : '—'}
              </span>
            </div>
          </div>
        </div>

      </div>
      </MacWindow>
    </div>
  )
}

function Node({
  active,
  done,
  emphasis,
  icon,
  label,
}: {
  active: boolean
  done?: boolean
  emphasis?: boolean
  icon: React.ReactNode
  label: string
}) {
  let ring = 'border-zinc-200 bg-zinc-50 text-zinc-400'
  if (emphasis && active) {
    ring = 'border-[var(--lp-ink)]/20 bg-[var(--lp-ink)] text-white'
  } else if (active || done) {
    ring = 'border-zinc-300 bg-white text-[var(--lp-ink)]'
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-300 sm:h-11 sm:w-11 ${ring}`}
        animate={active && !done ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {icon}
      </motion.div>
      <span
        className={`text-[10px] font-medium sm:text-[11px] ${
          active || done ? 'text-[var(--lp-ink)]' : 'text-[var(--lp-faint)]'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function Pipe({
  lit,
  muted,
  blocked,
}: {
  lit: boolean
  muted?: boolean
  blocked?: boolean
}) {
  return (
    <div className="relative mx-0.5 flex h-0.5 flex-1 items-center sm:mx-1">
      <div className="h-px w-full bg-zinc-200" />
      <motion.div
        className={`absolute inset-y-0 left-0 h-px ${
          blocked ? 'bg-[var(--lp-ink)]' : muted ? 'bg-zinc-400' : 'bg-zinc-500'
        }`}
        initial={false}
        animate={{ width: lit ? '100%' : '0%' }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
      />
      {blocked && lit && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-white px-1 text-[10px] font-semibold text-[var(--lp-ink)]">
          ✕
        </span>
      )}
      {!blocked && (
        <IconArrowRight
          size={12}
          className={`absolute right-0 top-1/2 -translate-y-1/2 ${
            lit ? 'text-zinc-500' : 'text-zinc-300'
          }`}
        />
      )}
    </div>
  )
}

function StatusPill({ phase, mode }: { phase: Phase; mode: 'without' | 'with' }) {
  let text = 'Idle'

  if (mode === 'without') {
    if (phase === 1) text = 'Sending…'
    else if (phase === 2) text = 'Burning tokens'
    else if (phase >= 3) text = 'Charged'
  } else {
    if (phase === 1) text = 'Sending…'
    else if (phase === 2) text = 'Checking budget'
    else if (phase >= 3) text = 'HTTP 429'
  }

  return (
    <span className="rounded-full border border-black/[0.06] bg-white px-2 py-0.5 text-[10px] font-medium text-[var(--lp-muted)]">
      {text}
    </span>
  )
}
