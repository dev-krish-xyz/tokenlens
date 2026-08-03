'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { IconBolt, IconShieldLock } from '@tabler/icons-react'

type LogLine = {
  id: number
  model: string
  cost: number
  status: 'ok' | 'blocked'
}

const MODELS = [
  { model: 'gpt-4o', cost: 0.042 },
  { model: 'claude-sonnet', cost: 0.038 },
  { model: 'gpt-4o-mini', cost: 0.006 },
  { model: 'gemini-2.0', cost: 0.012 },
  { model: 'gpt-4o', cost: 0.055 },
  { model: 'claude-sonnet', cost: 0.048 },
  { model: 'gpt-4o', cost: 0.061 },
]

const BUDGET = 100
const START = 86.4
const LOG_SLOTS = 4

const SEED_LOG: LogLine = {
  id: 1,
  model: 'gpt-4o-mini',
  cost: 0.006,
  status: 'ok',
}

export function BudgetTheater() {
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)

  const [spend, setSpend] = useState(START + SEED_LOG.cost)
  const [logs, setLogs] = useState<LogLine[]>([SEED_LOG])
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const io = new IntersectionObserver(
      ([entry]) => {
        pausedRef.current = !entry?.isIntersecting
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduce) {
      setSpend(BUDGET)
      setBlocked(true)
      setLogs([
        { id: 1, model: 'gpt-4o', cost: 0.042, status: 'ok' },
        { id: 2, model: 'claude-sonnet', cost: 0.038, status: 'ok' },
        { id: 3, model: 'gpt-4o', cost: 0.055, status: 'blocked' },
      ])
      return
    }

    let cancelled = false
    let current = START + SEED_LOG.cost
    let idCounter = 1
    let step = 0
    let timer: number | undefined

    const clear = () => {
      if (timer !== undefined) window.clearTimeout(timer)
      timer = undefined
    }

    const schedule = (fn: () => void, ms: number) => {
      clear()
      timer = window.setTimeout(fn, ms)
    }

    const resetSoft = () => {
      if (cancelled) return
      current = START
      step = 0
      setSpend(START)
      setBlocked(false)
      schedule(tick, 1000)
    }

    const tick = () => {
      if (cancelled) return
      if (pausedRef.current) {
        schedule(tick, 400)
        return
      }

      const entry = MODELS[step % MODELS.length]!
      const next = current + entry.cost
      const willBlock = next > BUDGET
      idCounter += 1

      const line: LogLine = {
        id: idCounter,
        model: entry.model,
        cost: entry.cost,
        status: willBlock ? 'blocked' : 'ok',
      }

      if (willBlock) {
        setBlocked(true)
        setSpend(BUDGET)
        setLogs((prev) => [...prev, line].slice(-LOG_SLOTS))
        schedule(resetSoft, 4200)
        return
      }

      current = next
      setSpend(next)
      setLogs((prev) => [...prev, line].slice(-LOG_SLOTS))
      step += 1
      schedule(tick, 950)
    }

    schedule(tick, 800)

    return () => {
      cancelled = true
      clear()
    }
  }, [reduce])

  const pct = Math.min(100, (spend / BUDGET) * 100)
  const overThreshold = pct >= 92

  // Always show up to LOG_SLOTS real lines; pad with placeholders for stable height
  const visible = logs.slice(-LOG_SLOTS)
  const padCount = Math.max(0, LOG_SLOTS - visible.length)

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl border border-[var(--lp-line)] bg-white"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--lp-line)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
            <IconShieldLock size={15} stroke={1.5} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium leading-tight text-[var(--lp-ink)]">
              Budget enforcer
            </p>
            <p className="lp-mono truncate text-[11px] text-[var(--lp-faint)]">
              vk · prod-openai
            </p>
          </div>
        </div>
        <div
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-300 ${
            blocked ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#ECFDF5] text-[#059669]'
          }`}
        >
          {blocked ? 'Blocking' : 'Enforcing'}
        </div>
      </div>

      {/* Spend + meter */}
      <div className="shrink-0 border-b border-[var(--lp-line)] px-4 py-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-[var(--lp-muted)]">Month-to-date</p>
            <p
              className={`lp-mono mt-0.5 text-[28px] font-semibold tracking-tight tabular-nums transition-colors duration-300 sm:text-[30px] ${
                blocked ? 'text-[#DC2626]' : 'text-[var(--lp-ink)]'
              }`}
            >
              ${spend.toFixed(2)}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--lp-faint)]">
              of ${BUDGET.toFixed(0)} budget
            </p>
          </div>
          <p className="lp-mono pb-1 text-[12px] tabular-nums text-[var(--lp-faint)]">
            {pct.toFixed(0)}%
          </p>
        </div>

        <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out ${
              blocked
                ? 'bg-[#EF4444]'
                : overThreshold
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#F59E0B]'
                  : 'bg-[#6366F1]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Banner: absolute overlay when blocked so height stays stable without empty gap */}
        <div className="relative mt-3 h-[52px]">
          <div
            className={`absolute inset-0 rounded-xl border px-3.5 py-2.5 transition-opacity duration-300 ${
              blocked
                ? 'border-red-200 bg-[#FEF2F2] opacity-100'
                : 'pointer-events-none border-transparent opacity-0'
            }`}
            aria-hidden={!blocked}
          >
            <p className="text-[12px] font-medium text-[#DC2626]">
              HTTP 429 · Budget exceeded
            </p>
            <p className="lp-mono mt-0.5 text-[10px] text-red-700/70">
              provider never called · $0 charged
            </p>
          </div>
          {!blocked && (
            <div className="flex h-full items-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-3.5">
              <p className="text-[12px] text-[var(--lp-faint)]">
                Monitoring spend · blocks at ${BUDGET}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Request log */}
      <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
        <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--lp-muted)]">
          <IconBolt size={13} className="text-[#6366F1]" />
          Live request path
        </div>
        <div className="flex flex-1 flex-col justify-end gap-1.5">
          {Array.from({ length: padCount }).map((_, i) => (
            <div
              key={`pad-${i}`}
              className="flex h-8 items-center rounded-lg border border-transparent bg-zinc-50/50 px-2.5"
              aria-hidden
            >
              <span className="h-1 w-16 rounded bg-zinc-100" />
            </div>
          ))}
          {visible.map((log) => (
            <div
              key={log.id}
              className={`flex h-8 items-center justify-between gap-2 rounded-lg px-2.5 ${
                log.status === 'blocked'
                  ? 'bg-[#FEF2F2] ring-1 ring-red-200'
                  : 'bg-zinc-50'
              }`}
            >
              <span className="lp-mono truncate text-[11px] text-[var(--lp-ink)]">
                {log.model}
              </span>
              <span
                className={`lp-mono shrink-0 text-[11px] tabular-nums ${
                  log.status === 'blocked' ? 'text-[#DC2626]' : 'text-[var(--lp-muted)]'
                }`}
              >
                {log.status === 'blocked' ? 'BLOCKED' : `+$${log.cost.toFixed(3)}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
