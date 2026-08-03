'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { FadeIn, Section, SectionLabel, SectionSub, SectionTitle } from './ui.tsx'
import { MacWindow } from './MacWindow.tsx'
import { easeOutExpo } from '../lib/motion.ts'
import { highlightCode, type CodeToken } from '../lib/highlightCode.ts'

type TabId = 'openai' | 'anthropic' | 'gemini' | 'curl'

const SAMPLES: Array<{ id: TabId; label: string; file: string; plain: string }> = [
  {
    id: 'openai',
    label: 'OpenAI',
    file: 'gateway.ts',
    plain: `import OpenAI from "openai"

const client = new OpenAI({
  baseURL: "https://gateway.tokenlens.ai/v1",
  defaultHeaders: {
    "X-TL-Key": process.env.TOKENLENS_KEY,
  },
})

// Stream or JSON — budgets still enforce pre-call
const res = await client.chat.completions.create({
  model: "gpt-4o",
  stream: true,
  messages: [{ role: "user", content: "Hello" }],
})`,
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    file: 'gateway.ts',
    plain: `import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  baseURL: "https://gateway.tokenlens.ai",
  defaultHeaders: {
    "X-TL-Key": process.env.TOKENLENS_KEY,
  },
})

const msg = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
})`,
  },
  {
    id: 'gemini',
    label: 'Gemini',
    file: 'gateway.ts',
    plain: `import OpenAI from "openai"

// Same OpenAI-compatible path — virtual key routes to Gemini
const client = new OpenAI({
  baseURL: "https://gateway.tokenlens.ai/v1",
  defaultHeaders: {
    "X-TL-Key": process.env.TOKENLENS_KEY,
  },
})

const res = await client.chat.completions.create({
  model: "gemini-2.0-flash",
  stream: true,
  messages: [{ role: "user", content: "Hello" }],
})`,
  },
  {
    id: 'curl',
    label: 'cURL',
    file: 'request.sh',
    plain: `curl https://gateway.tokenlens.ai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "X-TL-Key: tl-vk-..." \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role":"user","content":"Hello"}]
  }'`,
  },
]

/** Dark IDE palette — One Dark / VS Code-inspired, indigo-friendly */
const TOKEN_CLASS: Record<CodeToken['t'], string> = {
  comment: 'text-[#6B7280]',
  kw: 'text-[#C4B5FD]',
  str: 'text-[#6EE7B7]',
  prop: 'text-[#93C5FD]',
  fn: 'text-[#A5B4FC]',
  plain: 'text-[#E4E4E7]',
  punct: 'text-[#71717A]',
  num: 'text-[#FBBF24]',
}

export function CodeStage() {
  const [tab, setTab] = useState<TabId>('openai')
  const [copied, setCopied] = useState(false)

  const tabs = useMemo(
    () =>
      SAMPLES.map((s) => ({
        ...s,
        lines: highlightCode(s.plain),
      })),
    [],
  )

  const active = tabs.find((t) => t.id === tab) ?? tabs[0]!

  async function copy() {
    try {
      await navigator.clipboard.writeText(active.plain)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  return (
    <Section dark className="py-20 sm:py-24 lg:py-28">
      <FadeIn>
        <p className="lp-mono mb-3 text-[12px] text-white/35 sm:text-[13px]">
          // drop-in · OpenAI-compatible · pre-provider
        </p>
        <SectionLabel light>06 — Integration</SectionLabel>
        <SectionTitle light>Three lines. Full control.</SectionTitle>
        <SectionSub light>
          Keep your existing SDK — stream or JSON. Point at the TokenLens
          gateway, attach a virtual key, and governance is on the path.
        </SectionSub>
      </FadeIn>

      <FadeIn delay={0.08} className="lp-code-stage mt-12">
        <MacWindow
          tone="dark"
          title={`${active.file} — TokenLens`}
          footer={
            <>
              <span className="lp-mono">UTF-8 · TypeScript · Spaces: 2</span>
              <span className="lp-mono text-indigo-300/50">gateway.tokenlens.ai</span>
            </>
          }
        >
          {/* Tab strip */}
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#111113] px-3 pt-1.5 sm:px-4">
            <div className="flex min-w-0 items-end gap-0.5">
              {tabs.map((t) => {
                const on = tab === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`relative rounded-t-[8px] px-4 py-2.5 text-[13px] font-medium transition-colors sm:px-5 ${
                      on
                        ? 'bg-[#16161a] text-white shadow-[0_-1px_0_rgba(255,255,255,0.04)]'
                        : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                    }`}
                  >
                    {t.label}
                    {on && (
                      <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-indigo-400" />
                    )}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={copy}
              className="mb-1.5 mr-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/60 transition hover:border-white/15 hover:bg-white/10 hover:text-white"
            >
              {copied ? (
                <IconCheck size={14} className="text-emerald-400" />
              ) : (
                <IconCopy size={14} />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="relative bg-[#0c0c0e]">
            {/* Subtle editor glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-500/[0.06] to-transparent"
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: easeOutExpo }}
                className="relative overflow-x-auto"
              >
                <div className="lp-mono min-h-[280px] min-w-max py-6 text-[13px] leading-[1.9] sm:min-h-[320px] sm:py-8 sm:text-[14px]">
                  {active.lines.map((line) => (
                    <div
                      key={line.n}
                      className="flex border-l-2 border-transparent hover:border-indigo-500/30 hover:bg-white/[0.03]"
                    >
                      <span className="w-14 shrink-0 select-none pr-5 text-right text-[12px] text-white/20 sm:w-16 sm:text-[13px]">
                        {line.n}
                      </span>
                      <span className="pr-10">
                        {line.tokens.length === 0 ? (
                          <span className="text-transparent">.</span>
                        ) : (
                          line.tokens.map((tok, i) => (
                            <span key={i} className={TOKEN_CLASS[tok.t]}>
                              {tok.v}
                            </span>
                          ))
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </MacWindow>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {[
            'OpenAI-compatible',
            'Streaming + JSON',
            'OpenAI · Anthropic · Gemini',
            'Virtual keys',
            'No SDK lock-in',
          ].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-[12px] font-medium text-white/55"
            >
              {chip}
            </span>
          ))}
        </div>
      </FadeIn>
    </Section>
  )
}
