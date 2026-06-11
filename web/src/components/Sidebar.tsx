'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconLayoutDashboard,
  IconFileText,
  IconUsers,
  IconKey,
  IconTrendingUp,
  IconBell,
  IconSettings,
  IconCreditCard,
} from '@tabler/icons-react'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string
}

type NavSection = {
  title: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Overview', icon: <IconLayoutDashboard size={15} /> },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { href: '/dashboard/logs', label: 'Request Logs', icon: <IconFileText size={15} /> },
      { href: '/dashboard/customers', label: 'Customers', icon: <IconUsers size={15} /> },
    ],
  },
  {
    title: 'Governance',
    items: [
      { href: '/dashboard/keys', label: 'Virtual Keys', icon: <IconKey size={15} /> },
      { href: '/dashboard/budget', label: 'Budget & Alerts', icon: <IconTrendingUp size={15} /> },
    ],
  },
  {
    title: 'Team & Access',
    items: [
      { href: '/dashboard/settings', label: 'Settings', icon: <IconSettings size={15} /> },
    ],
  },
  {
    title: 'Billing',
    items: [
      { href: '/dashboard/billing', label: 'Billing', icon: <IconCreditCard size={15} /> },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside
      style={{
        width: 220,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14,
          fontWeight: 600,
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          color: 'var(--t1)',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--pri)',
            flexShrink: 0,
          }}
        />
        TokenLens
        <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)', marginLeft: 'auto' }}>
          v1.0
        </span>
      </div>

      {/* Nav */}
      <div style={{ padding: '8px 0', flex: 1 }}>
        {SECTIONS.map((section, si) => (
          <div key={section.title}>
            {si > 0 && (
              <div
                style={{
                  height: 1,
                  background: 'var(--border)',
                  margin: '8px 12px',
                }}
              />
            )}
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--t3)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                padding: '14px 16px 4px',
              }}
            >
              {section.title}
            </div>
            {section.items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 12px',
                    margin: '1px 6px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    color: active ? 'var(--pri)' : 'var(--t2)',
                    background: active ? 'var(--pri-m)' : 'transparent',
                    fontWeight: active ? 500 : 400,
                    fontSize: 12,
                    textDecoration: 'none',
                    transition: 'background 0.1s, color 0.1s',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--bg)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                  {item.label}
                  {item.badge && (
                    <span
                      style={{
                        fontSize: 9,
                        background: 'var(--pri-m)',
                        color: 'var(--pri)',
                        padding: '1px 5px',
                        borderRadius: 9999,
                        marginLeft: 'auto',
                        fontWeight: 600,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </aside>
  )
}
