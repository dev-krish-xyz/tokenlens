'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import {
  IconChartLine,
  IconCode,
  IconShieldLock,
  IconUsers,
} from '@tabler/icons-react'
import { FadeIn, Section, SectionLabel, SectionSub, SectionTitle } from './ui.tsx'
import { easeOutExpo } from '../lib/motion.ts'

type FeatureId = 'budget' | 'margin' | 'integrate' | 'forecast'

const FEATURES: Array<{
  id: FeatureId
  icon: typeof IconShieldLock
  title: string
  body: string
  accent: string
  iconBg: string
}> = [
  {
    id: 'budget',
    icon: IconShieldLock,
    title: 'Hard budget enforcement',
    body: 'Block requests at the gateway before they reach your provider. HTTP 429 — $0 overage by design.',
    accent: 'text-[#4F46E5]',
    iconBg: 'bg-[#EEF2FF] text-[#4F46E5]',
  },
  {
    id: 'margin',
    icon: IconUsers,
    title: 'Per-customer margins',
    body: 'Pass X-TL-User-Id to see exactly how much AI each customer costs versus plan revenue.',
    accent: 'text-emerald-700',
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  {
    id: 'integrate',
    icon: IconCode,
    title: 'One-line integration',
    body: 'Keep your existing SDK. Point at the TokenLens gateway and attach a virtual key.',
    accent: 'text-sky-700',
    iconBg: 'bg-sky-50 text-sky-700',
  },
  {
    id: 'forecast',
    icon: IconChartLine,
    title: 'Spend forecasting',
    body: '30-day projections with anomaly signals. Know the trajectory before you hit the wall.',
    accent: 'text-amber-700',
    iconBg: 'bg-amber-50 text-amber-600',
  },
]

const AUTO_MS = 5200

export function FeatureBento() {
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { amount: 0.25 })
  const [active, setActive] = useState<FeatureId>('budget')
  const [paused, setPaused] = useState(false)

  // Auto-rotate features while section is visible
  useEffect(() => {
    if (reduce || !inView || paused) return
    const id = window.setInterval(() => {
      setActive((cur) => {
        const i = FEATURES.findIndex((f) => f.id === cur)
        return FEATURES[(i + 1) % FEATURES.length]!.id
      })
    }, AUTO_MS)
    return () => window.clearInterval(id)
  }, [reduce, inView, paused])

  const current = FEATURES.find((f) => f.id === active) ?? FEATURES[0]!

  return (
    <Section className="py-24 sm:py-32">
      <FadeIn>
        <SectionLabel>03 — Why TokenLens</SectionLabel>
        <SectionTitle>
          Every dollar in,
          <br className="hidden sm:block" /> every token out — governed.
        </SectionTitle>
        <SectionSub>
          Each capability is a live demo — not a static icon card. Watch budgets
          block, margins fill, code swap, and forecasts draw.
        </SectionSub>
      </FadeIn>

      <div
        ref={sectionRef}
        className="mt-14 grid items-stretch gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Feature selector */}
        <FadeIn delay={0.05}>
          <div className="flex flex-col gap-2">
            {FEATURES.map((f, i) => {
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
                  {/* Progress bar for auto-advance */}
                  {isOn && !reduce && !paused && inView && (
                    <motion.div
                      key={`prog-${f.id}`}
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-[#6366F1]/70"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: AUTO_MS / 1000, ease: 'linear' }}
                      style={{ transformOrigin: 'left' }}
                    />
                  )}
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isOn ? f.iconBg : 'bg-white text-zinc-400 ring-1 ring-zinc-100'
                      }`}
                    >
                      <Icon size={18} stroke={1.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="lp-mono text-[10px] text-[var(--lp-faint)]">
                          0{i + 1}
                        </span>
                        <h3
                          className={`text-[15px] font-semibold tracking-tight ${
                            isOn ? 'text-[var(--lp-ink)]' : 'text-[var(--lp-muted)]'
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

        {/* Live demo stage */}
        <FadeIn delay={0.1}>
          <div className="relative h-full min-h-[420px] overflow-hidden rounded-[24px] border border-[var(--lp-line)] bg-[var(--lp-dark)] shadow-[var(--lp-card-shadow)] sm:min-h-[480px]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.2), transparent 55%)',
              }}
            />
            <div className="relative flex h-full flex-col p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
                  Live demo · {current.title}
                </p>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-white/50">
                  Interactive
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
                    {active === 'budget' && <DemoBudget />}
                    {active === 'margin' && <DemoMargin />}
                    {active === 'integrate' && <DemoIntegrate />}
                    {active === 'forecast' && <DemoForecast />}
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

/* ─── Demo: Budget ─────────────────────────────────────────── */

function DemoBudget() {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (reduce) {
      setStep(3)
      return
    }
    let cancelled = false
    let t: number
    const sequence = async () => {
      while (!cancelled) {
        setStep(0)
        await new Promise((r) => {
          t = window.setTimeout(r, 400)
        })
        if (cancelled) break
        setStep(1)
        await new Promise((r) => {
          t = window.setTimeout(r, 900)
        })
        if (cancelled) break
        setStep(2)
        await new Promise((r) => {
          t = window.setTimeout(r, 800)
        })
        if (cancelled) break
        setStep(3)
        await new Promise((r) => {
          t = window.setTimeout(r, 2200)
        })
      }
    }
    void sequence()
    return () => {
      cancelled = true
      window.clearTimeout(t!)
    }
  }, [reduce])

  const spend = step === 0 ? 94.2 : step === 1 ? 97.8 : 100
  const pct = spend

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-white/50">prod-openai · monthly</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              step >= 3 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/15 text-emerald-300'
            }`}
          >
            {step >= 3 ? 'Blocking' : 'Enforcing'}
          </span>
        </div>
        <p
          className={`lp-mono mt-3 text-[36px] font-semibold tabular-nums tracking-tight transition-colors duration-300 ${
            step >= 3 ? 'text-red-400' : 'text-white'
          }`}
        >
          ${spend.toFixed(1)}
          <span className="text-[14px] font-medium text-white/35"> / $100</span>
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className={`h-full rounded-full ${step >= 3 ? 'bg-red-500' : 'bg-[#6366F1]'}`}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {[
          { label: 'Incoming request', on: step >= 1 },
          { label: 'Budget check · INCRBYFLOAT', on: step >= 2 },
          { label: 'HTTP 429 · provider never called', on: step >= 3, bad: true },
        ].map((row) => (
          <div
            key={row.label}
            className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-300 ${
              row.on
                ? row.bad
                  ? 'border-red-500/30 bg-red-500/10'
                  : 'border-white/10 bg-white/[0.06]'
                : 'border-white/5 bg-white/[0.02] opacity-40'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                row.on ? (row.bad ? 'bg-red-400' : 'bg-[#818CF8]') : 'bg-white/20'
              }`}
            />
            <span
              className={`lp-mono text-[12px] ${
                row.bad && row.on ? 'text-red-300' : 'text-white/70'
              }`}
            >
              {row.label}
            </span>
          </div>
        ))}
      </div>

      <div
        className={`rounded-xl border px-4 py-3 text-center transition-all duration-300 ${
          step >= 3
            ? 'border-red-500/30 bg-red-500/10 text-red-300'
            : 'border-white/5 bg-white/[0.02] text-white/30'
        }`}
      >
        <p className="lp-mono text-[13px] font-medium">
          {step >= 3 ? '⊘ BLOCKED · $0 charged to OpenAI' : 'Waiting for over-budget call…'}
        </p>
      </div>
    </div>
  )
}

/* ─── Demo: Margin ─────────────────────────────────────────── */

const CUSTOMERS = [
  { name: 'acme-corp', cost: 41.2, rev: 50, color: '#6366F1' },
  { name: 'linear-app', cost: 45.6, rev: 50, color: '#F59E0B' },
  { name: 'notion-co', cost: 17.5, rev: 50, color: '#10B981' },
  { name: 'stripe-dev', cost: 28.1, rev: 50, color: '#8B5CF6' },
]

function DemoMargin() {
  const reduce = useReducedMotion()
  const [show, setShow] = useState(reduce ? true : false)

  useEffect(() => {
    if (reduce) return
    const t = window.setTimeout(() => setShow(true), 200)
    return () => window.clearTimeout(t)
  }, [reduce])

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[12px] text-white/50">
          Header{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5 lp-mono text-[11px] text-[#A5B4FC]">
            X-TL-User-Id
          </code>
        </p>
        <p className="text-[11px] text-white/35">cost vs plan</p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-5">
        {CUSTOMERS.map((c, i) => {
          const pct = (c.cost / c.rev) * 100
          const margin = (((c.rev - c.cost) / c.rev) * 100).toFixed(0)
          return (
            <div key={c.name}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="lp-mono text-[12px] text-white/80">{c.name}</span>
                <div className="flex items-center gap-3">
                  <span className="lp-mono text-[11px] text-white/40">
                    ${c.cost.toFixed(1)}
                  </span>
                  <span
                    className={`lp-mono text-[11px] font-medium ${
                      pct > 85 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {margin}% margin
                  </span>
                </div>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: c.color }}
                  initial={{ width: 0 }}
                  animate={{ width: show ? `${pct}%` : 0 }}
                  transition={{
                    duration: 0.9,
                    delay: reduce ? 0 : i * 0.12,
                    ease: easeOutExpo,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-center text-[12px] text-white/35">
        Know which customers are profitable on AI spend
      </p>
    </div>
  )
}

/* ─── Demo: Integrate ──────────────────────────────────────── */

function DemoIntegrate() {
  const reduce = useReducedMotion()
  const [side, setSide] = useState<'before' | 'after'>(reduce ? 'after' : 'before')

  useEffect(() => {
    if (reduce) return
    let cancelled = false
    const loop = async () => {
      while (!cancelled) {
        setSide('before')
        await new Promise((r) => window.setTimeout(r, 1800))
        if (cancelled) break
        setSide('after')
        await new Promise((r) => window.setTimeout(r, 2800))
      }
    }
    void loop()
    return () => {
      cancelled = true
    }
  }, [reduce])

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex gap-2">
        {(['before', 'after'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`rounded-full px-3 py-1 text-[12px] font-medium capitalize transition ${
              side === s
                ? s === 'after'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-white/10 text-white'
                : 'text-white/35 hover:text-white/60'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <AnimatePresence mode="wait">
          <motion.pre
            key={side}
            className="lp-mono absolute inset-0 overflow-auto p-5 text-[12px] leading-[1.85] sm:text-[13px]"
            initial={reduce ? false : { opacity: 0, x: side === 'after' ? 16 : -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduce ? 0 : side === 'after' ? -12 : 12 }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
          >
            {side === 'before' ? (
              <code>
                <span className="text-white/30">{'// Direct to OpenAI'}</span>
                {'\n'}
                <span className="text-white/60">baseURL:</span>{' '}
                <span className="text-emerald-400">
                  &quot;https://api.openai.com/v1&quot;
                </span>
                {'\n'}
                <span className="text-white/60">apiKey:</span>{' '}
                <span className="text-amber-300/80">&quot;sk-...&quot;</span>
                {'\n\n'}
                <span className="text-white/25">{'// No budget. No visibility.'}</span>
              </code>
            ) : (
              <code>
                <span className="text-white/30">{'// Through TokenLens'}</span>
                {'\n'}
                <span className="text-white/60">baseURL:</span>{' '}
                <span className="text-emerald-400">
                  &quot;https://gateway.tokenlens.ai/v1&quot;
                </span>
                {'\n'}
                <span className="text-white/60">headers:</span>
                {' {\n  '}
                <span className="text-[#A5B4FC]">&quot;X-TL-Key&quot;</span>
                {': '}
                <span className="text-emerald-400">&quot;tl-vk-...&quot;</span>
                {'\n}'}
                {'\n\n'}
                <span className="text-emerald-400/80">
                  {'// Budgets · logs · margins · on.'}
                </span>
              </code>
            )}
          </motion.pre>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-white/40">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            side === 'after' ? 'bg-emerald-400' : 'bg-white/30'
          }`}
        />
        {side === 'after' ? 'Governance enabled' : 'Unprotected path'}
      </div>
    </div>
  )
}

/* ─── Demo: Forecast ───────────────────────────────────────── */

function DemoForecast() {
  const reduce = useReducedMotion()
  const [drawn, setDrawn] = useState(!!reduce)

  useEffect(() => {
    if (reduce) return
    const t = window.setTimeout(() => setDrawn(true), 150)
    return () => window.clearTimeout(t)
  }, [reduce])

  // Historical (solid) + forecast (dashed) path
  const hist = [22, 28, 25, 32, 30, 38, 35, 42, 40, 48, 45, 52]
  const fut = [55, 58, 62, 60, 68, 72]
  const all = [...hist, ...fut]
  const max = Math.max(...all)
  const w = 320
  const h = 140
  const step = w / (all.length - 1)

  const toY = (v: number) => h - (v / max) * (h - 16) - 8
  const histD = hist
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${toY(p).toFixed(1)}`)
    .join(' ')
  const futStart = (hist.length - 1) * step
  const futD = [
    `M ${futStart.toFixed(1)} ${toY(hist[hist.length - 1]!).toFixed(1)}`,
    ...fut.map(
      (p, i) => `L ${((hist.length + i) * step).toFixed(1)} ${toY(p).toFixed(1)}`,
    ),
  ].join(' ')

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <p className="text-[11px] text-white/40">30-day projection</p>
          <motion.p
            className="lp-mono text-[32px] font-semibold tracking-tight text-amber-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            $3,420
          </motion.p>
        </div>
        <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-300">
          +18% vs last month
        </span>
      </div>

      <div className="relative mt-2 flex-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" aria-hidden>
          {/* grid lines */}
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1={0}
              x2={w}
              y1={h * g}
              y2={h * g}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          ))}
          {/* fill under history */}
          <motion.path
            d={`${histD} L ${futStart} ${h} L 0 ${h} Z`}
            fill="url(#fcFill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: drawn ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          />
          <defs>
            <linearGradient id="fcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* historical line */}
          <motion.path
            d={histD}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: drawn ? 1 : 0 }}
            transition={{ duration: 1.1, ease: easeOutExpo }}
          />
          {/* forecast dashed */}
          <motion.path
            d={futD}
            fill="none"
            stroke="#FBBF24"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="6 5"
            strokeOpacity={0.7}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: drawn ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: easeOutExpo }}
          />
          {/* anomaly marker */}
          {drawn && (
            <motion.circle
              cx={(hist.length - 2) * step}
              cy={toY(hist[hist.length - 2]!)}
              r={4}
              fill="#EF4444"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.1, type: 'spring', stiffness: 400, damping: 20 }}
            />
          )}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-white/35">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded bg-amber-500" /> Actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded border-t border-dashed border-amber-300" /> Forecast
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Anomaly
        </span>
      </div>
    </div>
  )
}
