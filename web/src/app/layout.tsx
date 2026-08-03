import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TokenLens — AI cost governance',
  description:
    'Hard-block over-budget AI calls before they hit OpenAI, Anthropic, or Gemini. Atomic budgets, virtual keys, streaming — $0 charged when blocked.',
  openGraph: {
    title: 'TokenLens — AI cost governance',
    description:
      'Gateway that hard-stops AI overspend before the provider call. Virtual keys, budgets, logs.',
    type: 'website',
    siteName: 'TokenLens',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TokenLens — AI cost governance',
    description:
      'Hard-block over-budget AI calls before the provider. OpenAI · Anthropic · Gemini.',
  },
  icons: {
    apple: [{ url: '/logo.svg', type: 'image/svg+xml' }],
  },
}

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
