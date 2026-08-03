'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { easeOutExpo } from '../../lib/motion.ts'

export function DemoForecast() {
  const reduce = useReducedMotion()
  const [drawn, setDrawn] = useState(!!reduce)

  useEffect(() => {
    if (reduce) return
    const t = window.setTimeout(() => setDrawn(true), 150)
    return () => window.clearTimeout(t)
  }, [reduce])

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
            className="lp-mono text-[32px] font-semibold tracking-tight text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            $3,420
          </motion.p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/60">
          +18% vs last month
        </span>
      </div>

      <div className="relative mt-2 flex-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" aria-hidden>
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
          <motion.path
            d={`${histD} L ${futStart} ${h} L 0 ${h} Z`}
            fill="url(#fcFill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: drawn ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          />
          <defs>
            <linearGradient id="fcFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={histD}
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: drawn ? 1 : 0 }}
            transition={{ duration: 1.1, ease: easeOutExpo }}
          />
          <motion.path
            d={futD}
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="6 5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: drawn ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: easeOutExpo }}
          />
          {drawn && (
            <motion.circle
              cx={(hist.length - 2) * step}
              cy={toY(hist[hist.length - 2]!)}
              r={4}
              fill="rgba(255,255,255,0.9)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.1, type: 'spring', stiffness: 400, damping: 20 }}
            />
          )}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-white/35">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded bg-white/80" /> Actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded border-t border-dashed border-white/40" /> Forecast
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white/80" /> Anomaly
        </span>
      </div>
    </div>
  )
}
