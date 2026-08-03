'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { IconMenu2, IconX } from '@tabler/icons-react'
import { easeOutExpo } from '../lib/motion.ts'

const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4"
      initial={reduce ? false : { y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: easeOutExpo }}
    >
      <nav
        className={`pointer-events-auto mx-auto flex h-[52px] max-w-[1080px] items-center gap-2 rounded-full px-2 pl-3 transition-[box-shadow,background] duration-300 sm:h-14 sm:gap-3 sm:px-2.5 sm:pl-3.5 ${
          scrolled
            ? 'lp-glass-nav shadow-[0_12px_40px_rgba(0,0,0,0.1)]'
            : 'lp-glass-nav'
        }`}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5 pr-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[linear-gradient(145deg,#6366F1_0%,#4F46E5_55%,#312E81_100%)] text-[11px] font-bold tracking-tight text-white shadow-[0_2px_8px_rgba(99,102,241,0.4)]">
            TL
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--lp-ink)]">
            TokenLens
          </span>
        </Link>

        <div className="mx-auto hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1.5 text-[13.5px] font-medium text-[var(--lp-muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--lp-ink)]"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-1.5 md:flex">
          <Link
            href="/login"
            className="rounded-full px-3.5 py-1.5 text-[13.5px] font-medium text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-ink)]"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center rounded-full bg-[var(--lp-ink)] px-4 text-[13px] font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_2px_8px_rgba(0,0,0,0.15)] transition hover:bg-zinc-800"
          >
            Start free
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-[var(--lp-muted)] transition hover:bg-black/[0.04] hover:text-[var(--lp-ink)] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <IconX size={18} /> : <IconMenu2 size={18} />}
        </button>
      </nav>

      {open && (
        <div className="pointer-events-auto mx-auto mt-2 max-w-[1080px] overflow-hidden rounded-3xl border border-[var(--lp-line)] bg-white/95 p-4 shadow-xl backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-[15px] font-medium text-[var(--lp-ink)] hover:bg-zinc-50"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-[var(--lp-line)] pt-3">
            <Link
              href="/login"
              className="rounded-full border border-[var(--lp-line)] py-2.5 text-center text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[var(--lp-ink)] py-2.5 text-center text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              Start free
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  )
}
