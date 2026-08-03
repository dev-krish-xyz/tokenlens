'use client'

import { useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useDemoLoop } from '../../lib/useDemoLoop.ts'

export function DemoAlerts() {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState(0)

  useDemoLoop(
    async ({ wait, cancelled }) => {
      while (!cancelled()) {
        setPhase(0)
        await wait(600)
        if (cancelled()) break
        setPhase(1)
        await wait(900)
        if (cancelled()) break
        setPhase(2)
        await wait(1000)
        if (cancelled()) break
        setPhase(3)
        await wait(2200)
      }
    },
    [],
    { reduce, onReduce: () => setPhase(3) },
  )

  const events = [
    { title: 'Budget sweep', detail: 'prod-openai · 92% of monthly cap', on: phase >= 1 },
    { title: 'Anomaly detected', detail: 'Spend 3.2× vs 7-day baseline', on: phase >= 2 },
    {
      title: 'Webhook delivered',
      detail: 'POST hooks.ops.example · 200 · cooldown 1h',
      on: phase >= 3,
    },
  ]

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-white/50">Alert pipeline</p>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
            {phase >= 3 ? 'Dispatched' : 'Watching'}
          </span>
        </div>
        <p className="mt-3 text-[20px] font-semibold tracking-tight text-white">
          Budget + anomaly
        </p>
        <p className="mt-1 text-[12px] text-white/40">
          Worker sweep · SSRF-guarded webhooks · HTML-escaped email
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-2">
        {events.map((e) => (
          <div
            key={e.title}
            className={`rounded-xl border px-3.5 py-3 transition-all duration-300 ${
              e.on
                ? 'border-white/15 bg-white/[0.07]'
                : 'border-white/5 bg-white/[0.02] opacity-40'
            }`}
          >
            <p className="text-[13px] font-medium text-white/90">{e.title}</p>
            <p className="lp-mono mt-0.5 text-[11px] text-white/40">{e.detail}</p>
          </div>
        ))}
      </div>

      <div
        className={`rounded-xl border px-4 py-3 text-center text-[12px] transition-all duration-300 ${
          phase >= 3
            ? 'border-white/15 bg-white/[0.06] text-white/70'
            : 'border-white/5 text-white/30'
        }`}
      >
        {phase >= 3
          ? 'alert:sent · deduped for cooldown window'
          : 'Waiting for threshold…'}
      </div>
    </div>
  )
}
