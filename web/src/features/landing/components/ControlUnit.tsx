'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { IconKey, IconLayersIntersect } from '@tabler/icons-react'
import { FadeIn, Section, SectionLabel, SectionSub, SectionTitle } from './ui.tsx'
import { MacWindow } from './MacWindow.tsx'
import { easeOutExpo } from '../lib/motion.ts'
import {
  applyControlBump,
  blockControlKey,
  controlKeysFromSpends,
  CONTROL_BUMPS,
  CONTROL_SPENDS_FROZEN,
  CONTROL_SPENDS_START,
  workspaceSpend,
  WS_CAP,
  type ControlKey,
} from '../lib/demoModel.ts'
import { useDemoLoop } from '../lib/useDemoLoop.ts'

/**
 * 03 — Virtual keys + workspace budget hierarchy.
 */
export function ControlUnit() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.3 })
  const pausedRef = useRef(false)

  const [keys, setKeys] = useState<ControlKey[]>(() =>
    controlKeysFromSpends(CONTROL_SPENDS_START),
  )
  const [highlight, setHighlight] = useState<string | null>(null)
  const [step, setStep] = useState(0)

  const wsSpend = workspaceSpend(keys)

  useEffect(() => {
    pausedRef.current = !inView
  }, [inView])

  useDemoLoop(
    async ({ wait, cancelled, waitWhilePaused }) => {
      let cycle = 0
      while (!cancelled() && cycle <= 50) {
        await waitWhilePaused()
        if (cancelled()) break

        setStep(0)
        setHighlight(null)
        setKeys(controlKeysFromSpends(CONTROL_SPENDS_START))
        await wait(700)
        if (cancelled()) break

        setStep(1)
        for (const b of CONTROL_BUMPS) {
          if (cancelled()) break
          await waitWhilePaused()
          if (cancelled()) break
          setHighlight(b.id)
          setKeys((prev) => applyControlBump(prev, b.id, b.add))
          await wait(750)
        }
        if (cancelled()) break

        setStep(2)
        setHighlight('k3')
        setKeys((prev) => blockControlKey(prev, 'k3'))
        await wait(1800)
        if (cancelled()) break

        setStep(3)
        await wait(2000)
        cycle += 1
      }
    },
    [],
    {
      reduce,
      pausedRef,
      onReduce: () => {
        setKeys(controlKeysFromSpends(CONTROL_SPENDS_FROZEN))
        setHighlight('k3')
        setStep(3)
      },
    },
  )

  const wsPct = Math.min(100, (wsSpend / WS_CAP) * 100)

  return (
    <Section id="control" className="py-20 sm:py-24 lg:py-28">
      <FadeIn>
        <SectionLabel>03 — Control unit</SectionLabel>
        <SectionTitle>
          Virtual keys under
          <br className="hidden sm:block" /> a workspace ceiling.
        </SectionTitle>
        <SectionSub>
          Each key carries its own monthly cap, provider, and encrypted secret.
          Workspace budget is the hard outer limit.
        </SectionSub>
      </FadeIn>

      <FadeIn delay={0.08} className="mt-12">
        <div ref={ref}>
          <MacWindow
            title="app.tokenlens.ai / keys"
            footer={
              <>
                <span className="lp-mono">tl-vk · encrypted at rest</span>
                <span className="lp-mono">live simulation</span>
              </>
            }
          >
            <div className="grid bg-white lg:grid-cols-[1fr_1.15fr]">
              <div className="border-b border-[var(--lp-line)] p-5 sm:p-6 lg:border-b-0 lg:border-r">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--lp-line)] bg-zinc-50 text-[var(--lp-ink)]">
                    <IconLayersIntersect size={18} stroke={1.5} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--lp-ink)]">
                      Workspace budget
                    </p>
                    <p className="text-[11px] text-[var(--lp-faint)]">
                      Outer ceiling · all keys combined
                    </p>
                  </div>
                </div>

                <p className="lp-mono mt-6 text-[32px] font-semibold tracking-tight tabular-nums text-[var(--lp-ink)]">
                  ${wsSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  <span className="text-[14px] font-medium text-[var(--lp-faint)]">
                    {' '}
                    / ${WS_CAP.toLocaleString()}
                  </span>
                </p>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <motion.div
                    className="h-full rounded-full bg-[var(--lp-ink)]"
                    animate={{ width: `${wsPct}%` }}
                    transition={{ duration: 0.5, ease: easeOutExpo }}
                  />
                </div>

                <div className="mt-6 space-y-2 rounded-xl border border-[var(--lp-line)] bg-zinc-50/80 p-3.5">
                  {[
                    { label: 'Hierarchy', value: 'Workspace → keys' },
                    { label: 'Enforcement', value: 'Pre-call · atomic' },
                    { label: 'Secrets', value: 'AES-256-GCM · never logged' },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between text-[12px]"
                    >
                      <span className="text-[var(--lp-faint)]">{row.label}</span>
                      <span className="font-medium text-[var(--lp-ink)]">{row.value}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[12px] leading-relaxed text-[var(--lp-muted)]">
                  {step < 2
                    ? 'Spend accrues per key. Workspace tracks the sum.'
                    : step === 2
                      ? 'staging-gemini hit its key cap — blocked with 429.'
                      : 'Key caps isolate blast radius. Workspace protects the org.'}
                </p>
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconKey size={16} className="text-[var(--lp-muted)]" stroke={1.5} />
                    <p className="text-[13px] font-semibold text-[var(--lp-ink)]">Virtual keys</p>
                  </div>
                  <span className="lp-mono text-[11px] text-[var(--lp-faint)]">
                    {keys.length} active
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {keys.map((k) => {
                    const pct = Math.min(100, (k.spend / k.cap) * 100)
                    const on = highlight === k.id
                    return (
                      <div
                        key={k.id}
                        className={`rounded-xl border px-3.5 py-3 transition-all duration-300 ${
                          on
                            ? 'border-[var(--lp-ink)]/20 bg-zinc-50 shadow-sm'
                            : 'border-[var(--lp-line)] bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="lp-mono truncate text-[12px] font-medium text-[var(--lp-ink)]">
                              {k.name}
                            </p>
                            <p className="text-[11px] text-[var(--lp-faint)]">{k.provider}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                              k.status === 'blocked'
                                ? 'border-[var(--lp-ink)]/15 bg-[var(--lp-ink)] text-white'
                                : k.status === 'near'
                                  ? 'border-[var(--lp-line)] bg-zinc-100 text-[var(--lp-muted)]'
                                  : 'border-[var(--lp-line)] bg-white text-[var(--lp-faint)]'
                            }`}
                          >
                            {k.status === 'blocked'
                              ? '429'
                              : k.status === 'near'
                                ? 'Near cap'
                                : 'Active'}
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                            <motion.div
                              className={`h-full rounded-full ${
                                k.status === 'blocked' ? 'bg-[var(--lp-ink)]' : 'bg-zinc-500'
                              }`}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.45, ease: easeOutExpo }}
                            />
                          </div>
                          <span className="lp-mono w-[7.5rem] shrink-0 text-right text-[10px] tabular-nums text-[var(--lp-muted)]">
                            ${k.spend.toFixed(0)} / ${k.cap}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </MacWindow>
        </div>
      </FadeIn>
    </Section>
  )
}
