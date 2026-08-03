'use client'

import Link from 'next/link'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'
import { easeOutExpo, staggerContainer, staggerItem } from '../lib/motion.ts'

export function Section({
  id,
  children,
  className = '',
  wide = false,
  dark = false,
}: {
  id?: string
  children: ReactNode
  className?: string
  wide?: boolean
  dark?: boolean
}) {
  return (
    <section
      id={id}
      className={`relative px-5 sm:px-8 lg:px-10 ${dark ? 'bg-[var(--lp-dark)] text-white' : ''} ${className}`}
    >
      <div className={`mx-auto w-full ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}>{children}</div>
    </section>
  )
}

export function SectionLabel({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`lp-micro mb-4 ${light ? 'text-white/45' : ''}`}>{children}</p>
  )
}

export function SectionTitle({
  children,
  className = '',
  light = false,
}: {
  children: ReactNode
  className?: string
  light?: boolean
}) {
  return (
    <h2 className={`lp-h2 ${light ? 'text-white' : 'text-[var(--lp-ink)]'} ${className}`}>
      {children}
    </h2>
  )
}

export function SectionSub({
  children,
  light = false,
}: {
  children: ReactNode
  light?: boolean
}) {
  return (
    <p
      className={`mt-4 max-w-xl text-[var(--lp-body)] leading-relaxed ${
        light ? 'text-white/55' : 'text-[var(--lp-muted)]'
      }`}
    >
      {children}
    </p>
  )
}

export function Badge({
  children,
  tone = 'pri',
}: {
  children: ReactNode
  tone?: 'pri' | 'ok' | 'err' | 'warn' | 'neutral'
}) {
  const tones = {
    pri: 'bg-[#EEF2FF] text-[#4F46E5]',
    ok: 'bg-[#ECFDF5] text-[#059669]',
    err: 'bg-[#FEF2F2] text-[#DC2626]',
    warn: 'bg-[#FFFBEB] text-[#D97706]',
    neutral: 'bg-zinc-100 text-zinc-600',
  }
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function PrimaryButton({
  href,
  children,
  className = '',
  onClick,
}: {
  href?: string
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  if (href) {
    return (
      <Link href={href} className={`lp-btn-primary ${className}`}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={`lp-btn-primary ${className}`}>
      {children}
    </button>
  )
}

export function SecondaryButton({
  href,
  children,
  className = '',
  onClick,
}: {
  href?: string
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  if (href) {
    return (
      <Link href={href} className={`lp-btn-secondary ${className}`}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={`lp-btn-secondary ${className}`}>
      {children}
    </button>
  )
}

export function Card({
  children,
  className = '',
  interactive = false,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <div
      className={`lp-card ${interactive ? 'lp-card-interactive' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function FadeIn({
  children,
  className = '',
  delay = 0,
  ...rest
}: {
  children: ReactNode
  className?: string
  delay?: number
} & HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: { opacity: 0, y: 22 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.65, ease: easeOutExpo, delay },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  )
}
