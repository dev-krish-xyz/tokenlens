'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TokenLensLogo } from './TokenLensLogo.tsx'
import {
  IconLayoutDashboard,
  IconChartBar,
  IconFileText,
  IconGitBranch,
  IconShieldLock,
  IconKey,
  IconLayersIntersect,
  IconUsers,
  IconChartLine,
  IconBell,
  IconPlug,
  IconHeartbeat,
  IconDatabase,
  IconUsersGroup,
  IconClipboardList,
  IconDownload,
  IconSettings,
} from '@tabler/icons-react'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string
  tab?: string
}

type NavSection = {
  title: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Overview', icon: <IconLayoutDashboard size={14} /> },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { href: '/dashboard/analytics', label: 'Usage & Analytics', icon: <IconChartBar size={14} /> },
      { href: '/dashboard/logs', label: 'Request Logs', icon: <IconFileText size={14} /> },
      { href: '/dashboard/analytics', label: 'Traces', icon: <IconGitBranch size={14} />, badge: 'new', tab: 'traces' },
    ],
  },
  {
    title: 'Governance',
    items: [
      { href: '/dashboard/guardrails', label: 'Guardrails', icon: <IconShieldLock size={14} /> },
      { href: '/dashboard/keys', label: 'Virtual Keys', icon: <IconKey size={14} /> },
      { href: '/dashboard/environments', label: 'Environments', icon: <IconLayersIntersect size={14} />, badge: 'new' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { href: '/dashboard/customers', label: 'Customers', icon: <IconUsers size={14} /> },
      { href: '/dashboard/forecasting', label: 'Forecasting', icon: <IconChartLine size={14} />, badge: 'new' },
      { href: '/dashboard/budget', label: 'Alerts', icon: <IconBell size={14} /> },
    ],
  },
  {
    title: 'Infrastructure',
    items: [
      { href: '/dashboard/providers', label: 'Providers', icon: <IconPlug size={14} /> },
      { href: '/dashboard/health', label: 'Gateway Health', icon: <IconHeartbeat size={14} />, badge: 'new' },
      { href: '/dashboard/cache', label: 'Cache', icon: <IconDatabase size={14} /> },
    ],
  },
  {
    title: 'Team & Access',
    items: [
      { href: '/dashboard/settings', label: 'Team Management', icon: <IconUsersGroup size={14} />, tab: 'team' },
      { href: '/dashboard/audit', label: 'Audit Log', icon: <IconClipboardList size={14} /> },
      { href: '/dashboard/export', label: 'Export Center', icon: <IconDownload size={14} /> },
    ],
  },
  {
    title: 'Settings',
    items: [
      { href: '/dashboard/settings', label: 'General Settings', icon: <IconSettings size={14} /> },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  function isActive(item: NavItem): boolean {
    if (item.href === '/dashboard') return pathname === '/dashboard'
    if (item.label === 'Team Management') return pathname.startsWith('/dashboard/settings')
    if (item.label === 'General Settings') return pathname === '/dashboard/settings'
    return pathname.startsWith(item.href)
  }

  return (
    <aside
      style={{
        width: 200,
        background: '#FAFAFA',
        borderRight: '1px solid #E4E4E7',
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
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          borderBottom: '1px solid #E4E4E7',
          flexShrink: 0,
        }}
      >
        <TokenLensLogo size={20} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0D0D0D', letterSpacing: '-0.01em' }}>
          TokenLens
        </span>
      </div>

      {/* Nav */}
      <div style={{ padding: '6px 0', flex: 1 }}>
        {SECTIONS.map((section, si) => (
          <div key={section.title}>
            {si > 0 && (
              <div style={{ height: 1, background: '#E4E4E7', margin: '6px 12px' }} />
            )}
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: '#A1A1AA',
                padding: '10px 16px 3px',
                letterSpacing: '0.02em',
              }}
            >
              {section.title}
            </div>
            {section.items.map((item) => {
              const active = isActive(item)
              const href = item.tab ? `${item.href}?tab=${item.tab}` : item.href
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '6px 10px',
                    margin: '1px 8px',
                    borderRadius: 7,
                    cursor: 'pointer',
                    color: active ? '#0D0D0D' : '#52525B',
                    background: active ? '#EBEBEC' : 'transparent',
                    fontWeight: active ? 500 : 400,
                    fontSize: 12,
                    textDecoration: 'none',
                    transition: 'all 0.08s',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = '#F0F0F2'
                      e.currentTarget.style.color = '#18181B'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#52525B'
                    }
                  }}
                >
                  <span style={{ flexShrink: 0, opacity: active ? 1 : 0.8, display: 'flex' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ fontSize: 10, color: '#C4C4C4', fontWeight: 400 }}>
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
