import Link from 'next/link'
import { TokenLensLogo } from '../../../components/TokenLensLogo.tsx'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Start free', href: '/register' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Privacy', href: 'mailto:privacy@tokenlens.ai' },
      { label: 'Terms', href: 'mailto:legal@tokenlens.ai' },
      { label: 'Contact', href: 'mailto:hello@tokenlens.ai' },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--lp-line)] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-1.5">
              <TokenLensLogo size={28} />
              <span className="text-[15px] font-semibold tracking-tight">TokenLens</span>
            </div>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[var(--lp-muted)]">
              AI cost governance control plane. Enforce budgets before the call.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--lp-line)] bg-zinc-50 px-3 py-1.5 text-[12px] text-[var(--lp-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Gateway operational
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--lp-faint)]">
                {col.title}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[14px] text-[var(--lp-muted)] transition hover:text-[var(--lp-ink)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[var(--lp-line)] pt-6 sm:flex-row sm:items-center">
          <p className="text-[13px] text-[var(--lp-faint)]">© 2026 TokenLens, Inc.</p>
          <p className="lp-mono text-[11px] text-[var(--lp-faint)]">
            enforce · before · the call
          </p>
        </div>
      </div>
    </footer>
  )
}
