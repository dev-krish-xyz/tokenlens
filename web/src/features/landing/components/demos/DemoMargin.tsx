'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { easeOutExpo } from '../../lib/motion.ts'

const CUSTOMERS = [
  { name: 'acme-corp', cost: 41.2, rev: 50, color: 'rgba(255,255,255,0.85)' },
  { name: 'linear-app', cost: 45.6, rev: 50, color: 'rgba(255,255,255,0.65)' },
  { name: 'notion-co', cost: 17.5, rev: 50, color: 'rgba(255,255,255,0.45)' },
  { name: 'stripe-dev', cost: 28.1, rev: 50, color: 'rgba(255,255,255,0.55)' },
]

export function DemoMargin() {
  const reduce = useReducedMotion()
  const [show, setShow] = useState(!!reduce)

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
                  <span className="lp-mono text-[11px] text-white/40">${c.cost.toFixed(1)}</span>
                  <span
                    className={`lp-mono text-[11px] font-medium ${
                      pct > 85 ? 'text-white/70' : 'text-white/50'
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
