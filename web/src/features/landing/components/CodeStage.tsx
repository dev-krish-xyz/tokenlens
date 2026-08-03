'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { FadeIn, Section, SectionLabel, SectionSub, SectionTitle } from './ui.tsx'
import { easeOutExpo } from '../lib/motion.ts'

type TabId = 'openai' | 'anthropic' | 'curl'

type Token =
  | { t: 'comment'; v: string }
  | { t: 'kw'; v: string }
  | { t: 'str'; v: string }
  | { t: 'prop'; v: string }
  | { t: 'fn'; v: string }
  | { t: 'plain'; v: string }
  | { t: 'punct'; v: string }
  | { t: 'num'; v: string }

type CodeLine = { n: number; tokens: Token[] }

const TABS: Array<{
  id: TabId
  label: string
  file: string
  lines: CodeLine[]
  plain: string
}> = [
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

const res = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello" }],
})`,
    lines: [
      {
        n: 1,
        tokens: [
          { t: 'kw', v: 'import' },
          { t: 'plain', v: ' OpenAI ' },
          { t: 'kw', v: 'from' },
          { t: 'plain', v: ' ' },
          { t: 'str', v: '"openai"' },
        ],
      },
      { n: 2, tokens: [] },
      {
        n: 3,
        tokens: [
          { t: 'kw', v: 'const' },
          { t: 'plain', v: ' client = ' },
          { t: 'kw', v: 'new' },
          { t: 'fn', v: ' OpenAI' },
          { t: 'punct', v: '({' },
        ],
      },
      {
        n: 4,
        tokens: [
          { t: 'plain', v: '  ' },
          { t: 'prop', v: 'baseURL' },
          { t: 'punct', v: ': ' },
          { t: 'str', v: '"https://gateway.tokenlens.ai/v1"' },
          { t: 'punct', v: ',' },
        ],
      },
      {
        n: 5,
        tokens: [
          { t: 'plain', v: '  ' },
          { t: 'prop', v: 'defaultHeaders' },
          { t: 'punct', v: ': {' },
        ],
      },
      {
        n: 6,
        tokens: [
          { t: 'plain', v: '    ' },
          { t: 'str', v: '"X-TL-Key"' },
          { t: 'punct', v: ': ' },
          { t: 'prop', v: 'process' },
          { t: 'punct', v: '.' },
          { t: 'prop', v: 'env' },
          { t: 'punct', v: '.' },
          { t: 'prop', v: 'TOKENLENS_KEY' },
          { t: 'punct', v: ',' },
        ],
      },
      { n: 7, tokens: [{ t: 'punct', v: '  },' }] },
      { n: 8, tokens: [{ t: 'punct', v: '})' }] },
      { n: 9, tokens: [] },
      {
        n: 10,
        tokens: [
          { t: 'comment', v: '// Budgets enforced before every call' },
        ],
      },
      {
        n: 11,
        tokens: [
          { t: 'kw', v: 'const' },
          { t: 'plain', v: ' res = ' },
          { t: 'kw', v: 'await' },
          { t: 'plain', v: ' client.chat.completions.' },
          { t: 'fn', v: 'create' },
          { t: 'punct', v: '({' },
        ],
      },
      {
        n: 12,
        tokens: [
          { t: 'plain', v: '  ' },
          { t: 'prop', v: 'model' },
          { t: 'punct', v: ': ' },
          { t: 'str', v: '"gpt-4o"' },
          { t: 'punct', v: ',' },
        ],
      },
      {
        n: 13,
        tokens: [
          { t: 'plain', v: '  ' },
          { t: 'prop', v: 'messages' },
          { t: 'punct', v: ': [{ ' },
          { t: 'prop', v: 'role' },
          { t: 'punct', v: ': ' },
          { t: 'str', v: '"user"' },
          { t: 'punct', v: ', ' },
          { t: 'prop', v: 'content' },
          { t: 'punct', v: ': ' },
          { t: 'str', v: '"Hello"' },
          { t: 'punct', v: ' }],' },
        ],
      },
      { n: 14, tokens: [{ t: 'punct', v: '})' }] },
    ],
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
    lines: [
      {
        n: 1,
        tokens: [
          { t: 'kw', v: 'import' },
          { t: 'plain', v: ' Anthropic ' },
          { t: 'kw', v: 'from' },
          { t: 'plain', v: ' ' },
          { t: 'str', v: '"@anthropic-ai/sdk"' },
        ],
      },
      { n: 2, tokens: [] },
      {
        n: 3,
        tokens: [
          { t: 'kw', v: 'const' },
          { t: 'plain', v: ' client = ' },
          { t: 'kw', v: 'new' },
          { t: 'fn', v: ' Anthropic' },
          { t: 'punct', v: '({' },
        ],
      },
      {
        n: 4,
        tokens: [
          { t: 'plain', v: '  ' },
          { t: 'prop', v: 'baseURL' },
          { t: 'punct', v: ': ' },
          { t: 'str', v: '"https://gateway.tokenlens.ai"' },
          { t: 'punct', v: ',' },
        ],
      },
      {
        n: 5,
        tokens: [
          { t: 'plain', v: '  ' },
          { t: 'prop', v: 'defaultHeaders' },
          { t: 'punct', v: ': {' },
        ],
      },
      {
        n: 6,
        tokens: [
          { t: 'plain', v: '    ' },
          { t: 'str', v: '"X-TL-Key"' },
          { t: 'punct', v: ': ' },
          { t: 'prop', v: 'process' },
          { t: 'punct', v: '.' },
          { t: 'prop', v: 'env' },
          { t: 'punct', v: '.' },
          { t: 'prop', v: 'TOKENLENS_KEY' },
          { t: 'punct', v: ',' },
        ],
      },
      { n: 7, tokens: [{ t: 'punct', v: '  },' }] },
      { n: 8, tokens: [{ t: 'punct', v: '})' }] },
      { n: 9, tokens: [] },
      {
        n: 10,
        tokens: [
          { t: 'kw', v: 'const' },
          { t: 'plain', v: ' msg = ' },
          { t: 'kw', v: 'await' },
          { t: 'plain', v: ' client.messages.' },
          { t: 'fn', v: 'create' },
          { t: 'punct', v: '({' },
        ],
      },
      {
        n: 11,
        tokens: [
          { t: 'plain', v: '  ' },
          { t: 'prop', v: 'model' },
          { t: 'punct', v: ': ' },
          { t: 'str', v: '"claude-sonnet-4-20250514"' },
          { t: 'punct', v: ',' },
        ],
      },
      {
        n: 12,
        tokens: [
          { t: 'plain', v: '  ' },
          { t: 'prop', v: 'max_tokens' },
          { t: 'punct', v: ': ' },
          { t: 'num', v: '1024' },
          { t: 'punct', v: ',' },
        ],
      },
      {
        n: 13,
        tokens: [
          { t: 'plain', v: '  ' },
          { t: 'prop', v: 'messages' },
          { t: 'punct', v: ': [{ ' },
          { t: 'prop', v: 'role' },
          { t: 'punct', v: ': ' },
          { t: 'str', v: '"user"' },
          { t: 'punct', v: ', ' },
          { t: 'prop', v: 'content' },
          { t: 'punct', v: ': ' },
          { t: 'str', v: '"Hello"' },
          { t: 'punct', v: ' }],' },
        ],
      },
      { n: 14, tokens: [{ t: 'punct', v: '})' }] },
    ],
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
    lines: [
      {
        n: 1,
        tokens: [
          { t: 'fn', v: 'curl' },
          { t: 'plain', v: ' ' },
          { t: 'str', v: 'https://gateway.tokenlens.ai/v1/chat/completions' },
          { t: 'plain', v: ' \\' },
        ],
      },
      {
        n: 2,
        tokens: [
          { t: 'plain', v: '  ' },
          { t: 'prop', v: '-H' },
          { t: 'plain', v: ' ' },
          { t: 'str', v: '"Content-Type: application/json"' },
          { t: 'plain', v: ' \\' },
        ],
      },
      {
        n: 3,
        tokens: [
          { t: 'plain', v: '  ' },
          { t: 'prop', v: '-H' },
          { t: 'plain', v: ' ' },
          { t: 'str', v: '"X-TL-Key: tl-vk-..."' },
          { t: 'plain', v: ' \\' },
        ],
      },
      {
        n: 4,
        tokens: [
          { t: 'plain', v: '  ' },
          { t: 'prop', v: '-d' },
          { t: 'plain', v: ' ' },
          { t: 'str', v: "'{" },
        ],
      },
      {
        n: 5,
        tokens: [
          { t: 'str', v: '    "model": "gpt-4o",' },
        ],
      },
      {
        n: 6,
        tokens: [
          { t: 'str', v: '    "messages": [{"role":"user","content":"Hello"}]' },
        ],
      },
      {
        n: 7,
        tokens: [{ t: 'str', v: "  }'" }],
      },
    ],
  },
]

const TOKEN_CLASS: Record<Token['t'], string> = {
  comment: 'text-[#8B8B8B]',
  kw: 'text-[#7B6FBF]',
  str: 'text-[#3A8F6E]',
  prop: 'text-[#5B7C99]',
  fn: 'text-[#6B8CAE]',
  plain: 'text-[#3D3D3D]',
  punct: 'text-[#9A9A9A]',
  num: 'text-[#B07A3A]',
}

export function CodeStage() {
  const [tab, setTab] = useState<TabId>('openai')
  const [copied, setCopied] = useState(false)
  const active = TABS.find((t) => t.id === tab) ?? TABS[0]!

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
    <Section wide className="pb-24 sm:pb-32">
      <FadeIn>
        <SectionLabel>04 — Integration</SectionLabel>
        <SectionTitle>Three lines. Full control.</SectionTitle>
        <SectionSub>
          Keep your existing SDK. Point at the TokenLens gateway and attach a
          virtual key. Budgets, logs, and analytics come for free.
        </SectionSub>
      </FadeIn>

      <FadeIn delay={0.08} className="mt-12">
        {/* Full-width Mac window — matches page content width */}
        <div className="w-full overflow-hidden rounded-[14px] border border-black/[0.08] bg-[#F6F6F6] shadow-[0_1px_1px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),0_24px_48px_-12px_rgba(0,0,0,0.1)]">
          {/* Title bar */}
          <div className="relative flex h-12 items-center border-b border-black/[0.06] bg-gradient-to-b from-[#FBFBFB] to-[#F0F0F0] px-4">
            <div className="flex items-center gap-[7px]">
              <span className="h-[12px] w-[12px] rounded-full bg-[#FF5F57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]" />
              <span className="h-[12px] w-[12px] rounded-full bg-[#FEBC2E] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]" />
              <span className="h-[12px] w-[12px] rounded-full bg-[#28C840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 flex justify-center">
              <span className="lp-mono text-[12px] font-medium text-[#6B6B6B]">
                {active.file} — TokenLens
              </span>
            </div>
          </div>

          {/* Tab strip */}
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.05] bg-[#EEEEEE] px-3 pt-1.5 sm:px-4">
            <div className="flex min-w-0 items-end gap-0.5">
              {TABS.map((t) => {
                const on = tab === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`relative rounded-t-[8px] px-4 py-2.5 text-[13px] font-medium transition-colors sm:px-5 ${
                      on
                        ? 'bg-[#FAFAFA] text-[#1A1A1A] shadow-[0_-1px_0_rgba(0,0,0,0.04)]'
                        : 'text-[#6B6B6B] hover:bg-black/[0.03] hover:text-[#3D3D3D]'
                    }`}
                  >
                    {t.label}
                    {on && (
                      <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[#6366F1]" />
                    )}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={copy}
              className="mb-1.5 mr-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-black/[0.06] bg-white px-3 py-1.5 text-[12px] font-medium text-[#5A5A5A] shadow-sm transition hover:bg-[#FAFAFA] hover:text-[#1A1A1A]"
            >
              {copied ? <IconCheck size={14} className="text-emerald-600" /> : <IconCopy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Editor body */}
          <div className="relative bg-[#FAFAFA]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: easeOutExpo }}
                className="overflow-x-auto"
              >
                <div className="lp-mono min-h-[280px] min-w-max py-6 text-[13px] leading-[1.9] sm:min-h-[320px] sm:py-8 sm:text-[14px]">
                  {active.lines.map((line) => (
                    <div key={line.n} className="flex hover:bg-black/[0.015]">
                      <span className="w-14 shrink-0 select-none pr-5 text-right text-[12px] text-[#C0C0C0] sm:w-16 sm:text-[13px]">
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

            <div className="flex items-center justify-between border-t border-black/[0.05] bg-[#F3F3F3] px-5 py-2 text-[11px] text-[#8A8A8A]">
              <span className="lp-mono">UTF-8 · TypeScript · Spaces: 2</span>
              <span className="lp-mono">gateway.tokenlens.ai</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {['OpenAI-compatible', 'No SDK lock-in', 'Virtual keys'].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-[var(--lp-line)] bg-white px-3.5 py-1.5 text-[12px] font-medium text-[var(--lp-muted)]"
            >
              {chip}
            </span>
          ))}
        </div>
      </FadeIn>
    </Section>
  )
}
