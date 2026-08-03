'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { easeOutExpo } from '../../lib/motion.ts'
import { useDemoLoop } from '../../lib/useDemoLoop.ts'

export function DemoBudget() {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)

  useDemoLoop(
    async ({ wait, cancelled }) => {
      while (!cancelled()) {
        setStep(0)
        await wait(400)
        if (cancelled()) break
        setStep(1)
        await wait(900)
        if (cancelled()) break
        setStep(2)
        await wait(800)
        if (cancelled()) break
        setStep(3)
        await wait(2200)
      }
    },
    [],
    { reduce, onReduce: () => setStep(3) },
  )

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
