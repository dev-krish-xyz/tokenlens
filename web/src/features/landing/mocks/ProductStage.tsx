'use client'

import { BudgetTheater } from '../components/BudgetTheater.tsx'

/** Hero dashboard — Mac-style window, full content width */
export function ProductStage() {
  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -bottom-6 top-1/3 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1),transparent_70%)] blur-2xl"
      />

      <div className="relative overflow-hidden rounded-[14px] border border-black/[0.08] bg-[#F6F6F6] shadow-[0_1px_1px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.06),0_32px_64px_-16px_rgba(0,0,0,0.1)]">
        {/* Mac title bar */}
        <div className="relative flex h-11 items-center border-b border-black/[0.06] bg-gradient-to-b from-[#FBFBFB] to-[#F0F0F0] px-3.5">
          <div className="flex items-center gap-[7px]">
            <span className="h-[11px] w-[11px] rounded-full bg-[#FF5F57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#FEBC2E] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#28C840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 flex justify-center">
            <div className="flex h-6 max-w-[280px] items-center justify-center rounded-md bg-white/80 px-3 ring-1 ring-black/[0.05] sm:max-w-[360px]">
              <span className="lp-mono truncate text-[11px] text-[#6B6B6B]">
                app.tokenlens.ai / overview
              </span>
            </div>
          </div>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <StatusChip label="Latency" value="4.2ms" />
            <StatusChip label="Overage" value="$0.00" accent />
          </div>
        </div>

        {/* Body */}
        <div className="bg-white p-3 sm:p-4">
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="rounded-[12px] border border-[var(--lp-line)] bg-zinc-50/90 p-4">
                <p className="text-[12px] font-medium text-[var(--lp-muted)]">Virtual keys</p>
                <div className="mt-3 flex flex-col gap-2">
                  {[
                    { name: 'prod-openai', s: '$1,820', ok: true },
                    { name: 'staging-anthropic', s: '$412', ok: true },
                    { name: 'demo-gemini', s: '$186', ok: false },
                  ].map((k) => (
                    <div
                      key={k.name}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-black/[0.04]"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            k.ok ? 'bg-zinc-800' : 'bg-zinc-400'
                          }`}
                        />
                        <span className="lp-mono truncate text-[11px] text-[var(--lp-ink)]">
                          {k.name}
                        </span>
                      </div>
                      <span className="lp-mono shrink-0 text-[11px] tabular-nums text-[var(--lp-muted)]">
                        {k.s}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-1 flex-col rounded-[12px] border border-[var(--lp-line)] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-[var(--lp-muted)]">Daily spend</p>
                  <span className="text-[11px] text-[var(--lp-faint)]">14d</span>
                </div>
                <div className="mt-1 flex flex-1 items-end">
                  <Sparkline />
                </div>
              </div>

              <div className="flex gap-2 sm:hidden">
                <StatusChip label="Latency" value="4.2ms" className="flex-1" />
                <StatusChip label="Overage" value="$0.00" accent className="flex-1" />
              </div>
            </div>

            <div className="min-h-[300px] min-w-0">
              <BudgetTheater />
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-black/[0.05] bg-[#F3F3F3] px-4 py-1.5 text-[10px] text-[#8A8A8A]">
          <span className="lp-mono">workspace · production</span>
          <span className="lp-mono">budget enforcer · live</span>
        </div>
      </div>
    </div>
  )
}

function StatusChip({
  label,
  value,
  accent = false,
  className = '',
}: {
  label: string
  value: string
  accent?: boolean
  className?: string
}) {
  return (
    <div
      className={`rounded-lg border border-black/[0.06] bg-white px-2 py-1 shadow-sm ${className}`}
    >
      <p className="text-[8px] font-medium uppercase tracking-[0.08em] text-[var(--lp-faint)]">
        {label}
      </p>
      <p
        className={`lp-mono text-[11px] font-semibold tabular-nums leading-tight ${
          accent ? 'text-[var(--lp-ink)]' : 'text-[var(--lp-ink)]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function Sparkline() {
  const points = [18, 22, 19, 28, 24, 31, 27, 36, 33, 40, 38, 44, 42, 48]
  const max = Math.max(...points)
  const w = 240
  const h = 64
  const step = w / (points.length - 1)
  const d = points
    .map((p, i) => {
      const x = i * step
      const y = h - (p / max) * (h - 6) - 3
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" aria-hidden>
      <defs>
        <linearGradient id="sparkFillV2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(24,24,27)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="rgb(24,24,27)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#sparkFillV2)" />
      <path
        d={d}
        fill="none"
        stroke="rgb(39,39,42)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
