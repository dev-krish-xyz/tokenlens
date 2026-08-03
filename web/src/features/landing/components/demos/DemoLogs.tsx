'use client'

import { useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useDemoLoop } from '../../lib/useDemoLoop.ts'

const LOG_ROWS = [
  { model: 'gpt-4o', tokens: '1,842', cost: '$0.042', ms: '412', status: 'ok' },
  { model: 'claude-sonnet', tokens: '2,104', cost: '$0.038', ms: '388', status: 'ok' },
  { model: 'gpt-4o-mini', tokens: '640', cost: '$0.006', ms: '210', status: 'ok' },
  { model: 'gpt-4o', tokens: '—', cost: '$0.000', ms: '4', status: '429' },
  { model: 'gemini-2.0', tokens: '980', cost: '$0.012', ms: '301', status: 'ok' },
]

export function DemoLogs() {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(reduce ? LOG_ROWS.length : 1)

  useDemoLoop(
    async ({ wait, cancelled }) => {
      while (!cancelled()) {
        setVisible(1)
        for (let n = 2; n <= LOG_ROWS.length; n += 1) {
          await wait(700)
          if (cancelled()) return
          setVisible(n)
        }
        await wait(2200)
      }
    },
    [],
    {
      reduce,
      onReduce: () => setVisible(LOG_ROWS.length),
    },
  )

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] text-white/50">Request log · ClickHouse</p>
        <span className="lp-mono text-[10px] text-white/30">async · non-blocking</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.55fr_0.5fr] gap-1 border-b border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] uppercase tracking-wider text-white/30">
          <span>Model</span>
          <span>Tokens</span>
          <span>Cost</span>
          <span>ms</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-white/5">
          {LOG_ROWS.map((row, i) => {
            const on = i < visible
            return (
              <div
                key={`${row.model}-${i}`}
                className={`grid grid-cols-[1.2fr_0.7fr_0.7fr_0.55fr_0.5fr] gap-1 px-3 py-2.5 lp-mono text-[11px] transition-opacity duration-300 ${
                  on ? 'opacity-100' : 'opacity-15'
                }`}
              >
                <span className="truncate text-white/80">{row.model}</span>
                <span className="text-white/45">{row.tokens}</span>
                <span className="text-white/45">{row.cost}</span>
                <span className="text-white/45">{row.ms}</span>
                <span className={row.status === '429' ? 'text-white' : 'text-white/45'}>
                  {row.status}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-4 text-center text-[12px] text-white/35">
        Costed after the call · blocked rows cost $0
      </p>
    </div>
  )
}
