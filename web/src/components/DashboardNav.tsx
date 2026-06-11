'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/keys', label: 'API Keys' },
  { href: '/dashboard/logs', label: 'Logs' },
  { href: '/dashboard/customers', label: 'Customers' },
  { href: '/dashboard/budget', label: 'Budget' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/settings', label: 'Settings' },
]

export function DashboardNav() {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === item.href
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
