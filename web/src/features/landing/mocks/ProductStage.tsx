'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  IconBolt,
  IconChartBar,
  IconShieldLock,
  IconX,
} from '@tabler/icons-react'
import { MacWindow } from '../components/MacWindow.tsx'
import { easeOutExpo } from '../lib/motion.ts'
import {
  applyRequest,
  createHeroState,
  DEMO_TRAFFIC,
  ENFORCER_CAP,
  freezeHeroBlocked,
  softResetHero,
  workspaceSpend,
  WS_CAP,
  type HeroDemoState,
} from '../lib/demoModel.ts'
import { useDemoLoop } from '../lib/useDemoLoop.ts'
import { useScrollFlatten } from '../lib/useScrollFlatten.ts'

/**
 * Hero product stage — multi-panel live dashboard demo.
 * State math: demoModel. Motion: useScrollFlatten. Chrome: MacWindow.
 */
export function ProductStage() {
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const [state, setState] = useState<HeroDemoState>(() => createHeroState())

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => {
        pausedRef.current = !entry?.isIntersecting
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useDemoLoop(
    async ({ wait, cancelled, waitWhilePaused }) => {
      while (!cancelled()) {
        await waitWhilePaused()
        if (cancelled()) break

        // Soft-reset keys/enforcer only — keep request counters climbing
        let local!: HeroDemoState
        setState((prev) => {
          local = softResetHero(prev)
          return local
        })
        await wait(600)
        if (cancelled()) break

        let step = 0
        while (!cancelled()) {
          await waitWhilePaused()
          if (cancelled()) break

          const t = DEMO_TRAFFIC[step % DEMO_TRAFFIC.length]!
          step += 1
          const result = applyRequest(local, t)
          local = result.state
          setState(result.state)

          if (result.didBlock) {
            await wait(2800)
            break
          }
          await wait(850)
        }

        await wait(900)
      }
    },
    [],
    {
      reduce,
      pausedRef,
      onReduce: () => setState(freezeHeroBlocked()),
    },
  )

  const flatten = useScrollFlatten(rootRef)
  const mtd = workspaceSpend(state.keys)
  const enforcerPct = Math.min(100, (state.enforcerSpend / state.enforcerCap) * 100)
  const wsPct = Math.min(100, (mtd / WS_CAP) * 100)

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-6xl">
      <motion.div
        aria-hidden
        style={{ opacity: flatten.glowOpacity }}
        className="pointer-events-none absolute -inset-x-6 bottom-0 top-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.14),transparent_70%)] blur-2xl max-md:hidden"
      />
      <motion.div
        aria-hidden
        style={{ opacity: flatten.glowOpacity }}
        className="pointer-events-none absolute -inset-x-10 -bottom-4 top-1/3 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_70%)] blur-3xl max-md:hidden"
      />

      <div className="relative [perspective:1600px]" style={{ perspectiveOrigin: '50% 0%' }}>
        <motion.div
          className="relative transform-gpu overflow-hidden rounded-[14px] border border-black/[0.08] [transform-style:preserve-3d] [backface-visibility:hidden]"
          style={{
            rotateX: flatten.rotateX,
            scale: flatten.scale,
            boxShadow: flatten.boxShadow,
            transformOrigin: 'center top',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
          />
          <MacWindow
            className="border-0 shadow-none"
            title={
              <div className="flex h-6 max-w-[300px] items-center justify-center rounded-md bg-white/80 px-3 ring-1 ring-black/[0.05] sm:max-w-[380px]">
                <span className="lp-mono truncate text-[11px] text-[#6B6B6B]">
                  app.tokenlens.ai / overview
                </span>
              </div>
            }
            titleExtra={
              <div className="hidden items-center gap-2 sm:flex">
                <LiveDot on />
                <span className="text-[10px] font-medium text-[var(--lp-muted)]">Live demo</span>
              </div>
            }
            footer={
              <>
                <span className="lp-mono">workspace · production · stream + json</span>
                <span className="lp-mono">
                  {state.blocked
                    ? 'halted @ budgetEnforcer · $0 overage'
                    : 'gateway chain · enforcing'}
                </span>
              </>
            }
          >
            <DashboardBody state={state} mtd={mtd} enforcerPct={enforcerPct} wsPct={wsPct} />
          </MacWindow>
        </motion.div>
      </div>
    </div>
  )
}

function DashboardBody({
  state,
  mtd,
  enforcerPct,
  wsPct,
}: {
  state: HeroDemoState
  mtd: number
  enforcerPct: number
  wsPct: number
}) {
  return (
    <div className="flex bg-white">
      <aside className="hidden w-[148px] shrink-0 border-r border-[var(--lp-line)] bg-[#FAFAFA] p-3 md:block">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--lp-faint)]">
          Workspace
        </p>
        <nav className="flex flex-col gap-0.5">
          {['Overview', 'Keys', 'Logs', 'Alerts', 'Analytics'].map((item, i) => (
            <div
              key={item}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                i === 0
                  ? 'bg-white text-[var(--lp-ink)] shadow-sm ring-1 ring-black/[0.04]'
                  : 'text-[var(--lp-muted)]'
              }`}
            >
              {item}
            </div>
          ))}
        </nav>
        <div className="mt-6 rounded-xl border border-[var(--lp-line)] bg-white p-2.5">
          <p className="text-[9px] font-medium uppercase tracking-wider text-[var(--lp-faint)]">
            Workspace
          </p>
          <p className="lp-mono mt-1 text-[13px] font-semibold tabular-nums text-[var(--lp-ink)]">
            ${mtd.toFixed(0)}
          </p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-100">
            <motion.div
              className="h-full rounded-full bg-zinc-700"
              animate={{ width: `${wsPct}%` }}
              transition={{ duration: 0.45, ease: easeOutExpo }}
            />
          </div>
          <p className="mt-1 text-[9px] text-[var(--lp-faint)]">of ${WS_CAP.toLocaleString()}</p>
        </div>
        <div className="mt-3 space-y-1">
          {['OpenAI', 'Anthropic', 'Gemini'].map((p) => (
            <div key={p} className="flex items-center gap-1.5 text-[10px] text-[var(--lp-muted)]">
              <span className="h-1 w-1 rounded-full bg-zinc-400" />
              {p}
            </div>
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1 p-3 sm:p-4">
        {/* Mobile: prioritize enforcer story — compact stats */}
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard label="Month-to-date" value={`$${mtd.toFixed(0)}`} hint="workspace" />
          <StatCard label="Overage" value="$0.00" hint="guaranteed" accent />
          <div className="hidden sm:contents">
            <StatCard label="Requests" value={state.requests.toLocaleString()} hint="last 30d" />
            <StatCard label="Blocked" value={String(state.blockedCount)} hint="pre-provider" />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[0.95fr_1.15fr]">
          {/* Keys secondary on small screens — enforcer is the signature moment */}
          <div className="order-2 hidden sm:block lg:order-1">
            <KeysPanel keys={state.keys} activeKey={state.activeKey} />
          </div>
          <div className="order-1 lg:order-2">
            <EnforcerPanel state={state} enforcerPct={enforcerPct} />
          </div>
        </div>

        <div className="hidden sm:block">
          <RequestLogTable logs={state.logs} />
        </div>
      </div>
    </div>
  )
}

function KeysPanel({
  keys,
  activeKey,
}: {
  keys: HeroDemoState['keys']
  activeKey: string | null
}) {
  return (
    <div className="rounded-[12px] border border-[var(--lp-line)] bg-zinc-50/80 p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] font-semibold text-[var(--lp-ink)]">Virtual keys</p>
        <span className="lp-mono text-[10px] text-[var(--lp-faint)]">{keys.length} active</span>
      </div>
      <div className="flex flex-col gap-2">
        {keys.map((k) => {
          const pct = Math.min(100, (k.spend / k.cap) * 100)
          const atCap = k.spend >= k.cap
          const on = activeKey === k.id
          return (
            <div
              key={k.id}
              className={`rounded-xl border bg-white px-3 py-2.5 transition-all duration-300 ${
                on ? 'border-[var(--lp-ink)]/15 shadow-sm' : 'border-[var(--lp-line)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="lp-mono truncate text-[11px] font-medium text-[var(--lp-ink)]">
                    {k.name}
                  </p>
                  <p className="text-[10px] text-[var(--lp-faint)]">{k.provider}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                    atCap ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-[var(--lp-muted)]'
                  }`}
                >
                  {atCap ? '429' : 'Active'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100">
                  <motion.div
                    className="h-full rounded-full bg-zinc-600"
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4, ease: easeOutExpo }}
                  />
                </div>
                <span className="lp-mono w-16 shrink-0 text-right text-[9px] tabular-nums text-[var(--lp-faint)]">
                  ${k.spend.toFixed(0)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 rounded-xl border border-[var(--lp-line)] bg-white p-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="flex items-center gap-1 text-[11px] font-medium text-[var(--lp-muted)]">
            <IconChartBar size={12} stroke={1.5} />
            Daily spend
          </p>
          <span className="text-[10px] text-[var(--lp-faint)]">14d</span>
        </div>
        <Sparkline />
      </div>
    </div>
  )
}

function EnforcerPanel({
  state,
  enforcerPct,
}: {
  state: HeroDemoState
  enforcerPct: number
}) {
  const { blocked, enforcerSpend, toast, logs } = state
  return (
    <div className="flex min-h-[280px] flex-col overflow-hidden rounded-[12px] border border-[var(--lp-line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--lp-line)] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-[var(--lp-ink)]">
            <IconShieldLock size={14} stroke={1.5} />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-[var(--lp-ink)]">Budget enforcer</p>
            <p className="lp-mono text-[10px] text-[var(--lp-faint)]">vk · prod-openai</p>
          </div>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors duration-300 ${
            blocked
              ? 'border-[#FECACA]/80 bg-[#FEF2F2] text-[#B91C1C]'
              : 'border-[var(--lp-line)] bg-zinc-50 text-[var(--lp-muted)]'
          }`}
        >
          {blocked ? 'Blocking' : 'Enforcing'}
        </span>
      </div>

      <div className="border-b border-[var(--lp-line)] px-3.5 py-3.5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-medium text-[var(--lp-faint)]">Month-to-date</p>
            <p className="lp-mono text-[28px] font-semibold tracking-tight tabular-nums text-[var(--lp-ink)]">
              ${enforcerSpend.toFixed(2)}
            </p>
            <p className="text-[10px] text-[var(--lp-faint)]">of ${ENFORCER_CAP} key budget</p>
          </div>
          <p className="lp-mono text-[11px] tabular-nums text-[var(--lp-faint)]">
            {enforcerPct.toFixed(0)}%
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out ${
              blocked ? 'bg-[#E11D48]/80' : 'bg-[#6366F1]/85'
            }`}
            style={{ width: `${enforcerPct}%` }}
          />
        </div>

        <div className="relative mt-3 h-[48px]">
          <AnimatePresence mode="wait">
            {blocked && toast ? (
              <motion.div
                key="toast"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center gap-2 rounded-xl border border-[#FECACA]/70 bg-[#FEF2F2]/90 px-3"
              >
                <IconX size={14} className="shrink-0 text-[#B91C1C]" stroke={2} />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-[var(--lp-ink)]">{toast}</p>
                  <p className="lp-mono text-[9px] text-[var(--lp-faint)]">
                    Provider never called · $0 billed
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center rounded-xl border border-dashed border-zinc-200 px-3"
              >
                <p className="text-[11px] text-[var(--lp-faint)]">
                  Monitoring · blocks at ${ENFORCER_CAP}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3.5 py-3">
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium text-[var(--lp-muted)]">
          <IconBolt size={12} />
          Live request path
        </div>
        <div className="flex flex-1 flex-col justify-end gap-1">
          {Array.from({ length: 4 }).map((_, i) => {
            const offset = 4 - logs.length
            const log = i >= offset ? logs[i - offset] : null
            return (
              <div
                key={log?.id ?? `empty-${i}`}
                className={`flex h-7 items-center justify-between rounded-lg px-2.5 text-[10px] transition-colors duration-300 ${
                  log
                    ? log.status === '429'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-50 text-[var(--lp-ink)]'
                    : 'bg-zinc-50/50'
                }`}
              >
                {log ? (
                  <>
                    <span className="lp-mono truncate">{log.model}</span>
                    <span className="lp-mono shrink-0 tabular-nums opacity-70">
                      {log.status === '429' ? 'BLOCKED' : `+$${log.cost.toFixed(3)}`}
                    </span>
                  </>
                ) : (
                  <span className="text-transparent">—</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RequestLogTable({ logs }: { logs: HeroDemoState['logs'] }) {
  return (
    <div className="mt-3 overflow-hidden rounded-[12px] border border-[var(--lp-line)]">
      <div className="flex items-center justify-between border-b border-[var(--lp-line)] bg-zinc-50/80 px-3.5 py-2">
        <p className="text-[11px] font-semibold text-[var(--lp-ink)]">Request log</p>
        <span className="lp-mono text-[10px] text-[var(--lp-faint)]">ClickHouse · async</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <thead>
            <tr className="border-b border-[var(--lp-line)] text-[9px] uppercase tracking-wider text-[var(--lp-faint)]">
              <th className="px-3 py-2 font-medium">Model</th>
              <th className="px-3 py-2 font-medium">Key</th>
              <th className="px-3 py-2 font-medium">Tokens</th>
              <th className="px-3 py-2 font-medium">Cost</th>
              <th className="px-3 py-2 font-medium">ms</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[11px] text-[var(--lp-faint)]">
                  Waiting for traffic…
                </td>
              </tr>
            ) : (
              [...logs].reverse().map((log) => (
                <tr key={log.id} className="border-b border-[var(--lp-line)] last:border-0">
                  <td className="lp-mono px-3 py-1.5 text-[11px] text-[var(--lp-ink)]">{log.model}</td>
                  <td className="lp-mono px-3 py-1.5 text-[10px] text-[var(--lp-muted)]">{log.key}</td>
                  <td className="lp-mono px-3 py-1.5 text-[11px] tabular-nums text-[var(--lp-muted)]">
                    {log.tokens}
                  </td>
                  <td className="lp-mono px-3 py-1.5 text-[11px] tabular-nums text-[var(--lp-muted)]">
                    ${log.cost.toFixed(3)}
                  </td>
                  <td className="lp-mono px-3 py-1.5 text-[11px] tabular-nums text-[var(--lp-muted)]">
                    {log.ms}
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className={`lp-mono rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        log.status === '429'
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-[var(--lp-muted)]'
                      }`}
                    >
                      {log.status === '429' ? '429' : '200'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LiveDot({ on }: { on: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {on && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-40" />
      )}
      <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-700" />
    </span>
  )
}

function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string
  value: string
  hint: string
  accent?: boolean
}) {
  return (
    <div className="rounded-[12px] border border-[var(--lp-line)] bg-zinc-50/60 px-3 py-2.5">
      <p className="text-[10px] font-medium text-[var(--lp-faint)]">{label}</p>
      <p
        className={`lp-mono mt-0.5 text-[18px] font-semibold tracking-tight tabular-nums sm:text-[20px] ${
          accent ? 'text-[#059669]' : 'text-[var(--lp-ink)]'
        }`}
      >
        {value}
      </p>
      <p className="text-[9px] text-[var(--lp-faint)]">{hint}</p>
    </div>
  )
}

function Sparkline() {
  const points = [18, 22, 19, 28, 24, 31, 27, 36, 33, 40, 38, 44, 42, 48]
  const max = Math.max(...points)
  const w = 220
  const h = 40
  const step = w / (points.length - 1)
  const d = points
    .map((p, i) => {
      const x = i * step
      const y = h - (p / max) * (h - 4) - 2
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full" aria-hidden>
      <defs>
        <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(24,24,27)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="rgb(24,24,27)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#heroSpark)" />
      <path
        d={d}
        fill="none"
        stroke="rgb(39,39,42)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
