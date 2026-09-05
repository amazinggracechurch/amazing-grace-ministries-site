import type { Metadata } from 'next'
import Link from 'next/link'
import { HandHeart } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { givingStats, listDonations, type Donation } from '@/lib/admin/donations'
import { formatChicagoDate, type GivingStats } from '@/lib/admin/giving'
import { has } from '@/lib/env'
import { formatUsd } from '@/lib/money'

export const metadata: Metadata = {
  title: 'Admin | Amazing Grace Ministries MN',
  description: 'Church staff administration.',
}

export const dynamic = 'force-dynamic'

const QUICK_LINKS = [
  { href: '/admin/donations', label: 'Donations', body: 'The full ledger — filter, refund, export.' },
  { href: '/admin/members', label: 'Members', body: 'Accounts, roles, and giving history.' },
  { href: '/admin/projects', label: 'Projects', body: 'Funding projects and pledge progress.' },
  { href: '/admin/events', label: 'Events', body: 'Gatherings, RSVPs, and ticketing.' },
  { href: '/admin/blog', label: 'Blog', body: 'Announcements and stories.' },
  { href: '/admin/sermons', label: 'Sermons', body: 'Sunday messages and media.' },
  { href: '/admin/qr', label: 'QR Generator', body: 'Giving codes for print and slides.' },
  { href: '/admin/settings', label: 'Site Settings', body: 'Global content and configuration.' },
] as const

function statusVariant(status: string): 'success' | 'danger' | 'neutral' {
  if (status === 'succeeded') return 'success'
  if (status === 'failed') return 'danger'
  return 'neutral'
}

function StatBand({ stats }: { stats: GivingStats }) {
  const periods = [
    { label: 'Gifts this week', ...stats.week },
    { label: 'Gifts this month', ...stats.month },
    { label: 'Gifts this year', ...stats.year },
  ]
  return (
    <section aria-label="Giving totals" className="mt-14 border-y border-border-subtle">
      <div className="grid divide-y divide-border-subtle md:grid-cols-3 md:divide-x md:divide-y-0">
        {periods.map((period) => (
          <div key={period.label} className="py-10 md:px-10 md:first:pl-0">
            <p className="eyebrow text-text-muted">{period.label}</p>
            <p className="mt-4 font-display text-display-md font-light tracking-display text-text-primary">
              {formatUsd(period.totalCents)}
            </p>
            <p className="mt-2 text-body-sm text-text-secondary">
              {period.count === 1 ? '1 gift' : `${period.count} gifts`}
            </p>
          </div>
        ))}
      </div>
      <p className="border-t border-border-subtle py-4 text-body-sm text-text-secondary">
        This year: average gift {formatUsd(stats.averageGiftCents)} ·{' '}
        {stats.recurring.count} recurring · {stats.oneTime.count} one-time
      </p>
    </section>
  )
}

function RecentGifts({ donations }: { donations: Donation[] }) {
  if (donations.length === 0) {
    return (
      <EmptyState
        icon={<HandHeart className="size-6" aria-hidden />}
        title="No gifts recorded yet"
        body="When the first online gift arrives, it shows up here automatically — recorded by the Stripe webhook."
      />
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-body-sm">
        <thead>
          <tr className="border-b border-border-strong text-caption font-semibold uppercase tracking-eyebrow text-text-muted">
            <th scope="col" className="py-3 pr-4 font-semibold">Date</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Donor</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Fund</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Amount</th>
            <th scope="col" className="py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {donations.map((d) => (
            <tr key={d.id} className="border-b border-border-subtle">
              <td className="py-3 pr-4 text-text-secondary">{formatChicagoDate(d.createdAt)}</td>
              <td className="py-3 pr-4 text-text-primary">{d.donorEmail ?? '—'}</td>
              <td className="py-3 pr-4 text-text-secondary">{d.fund ?? '—'}</td>
              <td className="py-3 pr-4 font-semibold text-text-primary">{formatUsd(d.amountCents)}</td>
              <td className="py-3">
                <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function AdminPage() {
  if (!has.firebaseAdmin()) {
    return (
      <div>
        <p className="eyebrow text-text-muted">Admin</p>
        <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
          Overview<span className="text-accent">.</span>
        </h1>
        <div className="mt-12">
          <EmptyState
            icon={<HandHeart className="size-6" aria-hidden />}
            title="Firebase Admin is not configured"
            body="Add the FIREBASE_ADMIN_* service-account variables to .env.local to see giving data here."
          />
        </div>
      </div>
    )
  }

  const [stats, recent] = await Promise.all([
    givingStats(),
    listDonations({ page: 1, pageSize: 10 }),
  ])

  return (
    <div>
      <p className="eyebrow text-text-muted">Admin</p>
      <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
        Overview<span className="text-accent">.</span>
      </h1>

      <StatBand stats={stats} />

      <section aria-label="Recent gifts" className="mt-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-heading tracking-display text-text-primary">
            Recent gifts
          </h2>
          <Link
            href="/admin/donations"
            className="text-body-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            Full ledger
          </Link>
        </div>
        <div className="mt-6">
          <RecentGifts donations={recent.donations} />
        </div>
      </section>

      <section aria-label="Admin sections" className="mt-16">
        <h2 className="font-display text-heading tracking-display text-text-primary">
          Sections
        </h2>
        <div className="mt-6 grid gap-px border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col gap-2 bg-surface p-6 transition-colors duration-200 hover:bg-surface-sunken"
            >
              <span className="text-body font-semibold text-text-primary transition-colors duration-200 group-hover:text-accent">
                {link.label}
              </span>
              <span className="text-body-sm text-text-secondary">{link.body}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
