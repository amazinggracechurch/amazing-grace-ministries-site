'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

/**
 * In-portal navigation for /account — a quiet tab row pinned directly under
 * the fixed 72px site navbar (top-18 = 4.5rem). Portal pages already reserve
 * pt-32, which clears both bars. Rendered once by the (protected) layout.
 */

const ITEMS = [
  { href: '/account', label: 'Overview' },
  { href: '/account/giving', label: 'Giving' },
  { href: '/account/recurring', label: 'Recurring' },
  { href: '/account/pledges', label: 'My Pledges' },
  { href: '/account/rsvps', label: 'My RSVPs' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/profile', label: 'Profile' },
] as const

function isActive(pathname: string, href: string): boolean {
  if (href === '/account') return pathname === '/account'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AccountNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Account"
      className="fixed inset-x-0 top-18 z-40 border-b border-border-subtle bg-surface"
    >
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'whitespace-nowrap border-b-2 px-3 py-3 text-body-sm font-semibold transition-colors duration-200',
                active
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
