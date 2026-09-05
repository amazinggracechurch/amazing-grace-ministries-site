import type { Metadata } from 'next'
import { HandHeart } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import RefundButton from '@/components/admin/RefundButton'
import {
  DONATION_SOURCES,
  DONATION_STATUSES,
  fundSummary,
  listDonations,
  parseDonationFilters,
  type DonationFilters,
} from '@/lib/admin/donations'
import { formatChicagoDate } from '@/lib/admin/giving'
import { FUNDS, FUND_LABELS, type Fund } from '@/lib/donations/shared'
import { has } from '@/lib/env'
import { formatUsd } from '@/lib/money'

export const metadata: Metadata = {
  title: 'Donations | Admin | Amazing Grace Ministries MN',
  description: 'The giving ledger — filter, refund, and export donations.',
}

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function one(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

/** Querystring that preserves the active filters (page deliberately reset). */
function filterQuery(filters: DonationFilters, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

function statusVariant(status: string): 'success' | 'danger' | 'neutral' {
  if (status === 'succeeded') return 'success'
  if (status === 'failed') return 'danger'
  return 'neutral'
}

function netCents(d: { amountCents: number; feeCents: number | null }): number {
  return d.amountCents - (d.feeCents ?? 0)
}

export default async function AdminDonationsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const raw = await searchParams
  const filters = parseDonationFilters({
    fund: one(raw.fund),
    source: one(raw.source),
    status: one(raw.status),
    from: one(raw.from),
    to: one(raw.to),
  })
  const requestedPage = Number(one(raw.page) ?? '1')
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

  if (!has.firebaseAdmin()) {
    return (
      <div>
        <p className="eyebrow text-text-muted">Admin · Donations</p>
        <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
          Donations<span className="text-accent">.</span>
        </h1>
        <div className="mt-12">
          <EmptyState
            icon={<HandHeart className="size-6" aria-hidden />}
            title="Firebase Admin is not configured"
            body="Add the FIREBASE_ADMIN_* service-account variables to .env.local to see the ledger."
          />
        </div>
      </div>
    )
  }

  const [ledger, funds] = await Promise.all([
    listDonations({ ...filters, page, pageSize: PAGE_SIZE }),
    fundSummary({ from: filters.from, to: filters.to }),
  ])

  const exportHref = `/admin/donations/export${filterQuery(filters)}`

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-text-muted">Admin · Donations</p>
          <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
            Donations<span className="text-accent">.</span>
          </h1>
        </div>
        {/* Plain anchor (not next/link): this is a file download. */}
        <a
          href={exportHref}
          className="inline-flex items-center justify-center gap-2 border border-border-strong bg-surface-raised px-4 py-2 text-body font-semibold text-text-primary transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          Export CSV
        </a>
      </div>

      {/* GET form — filters live in the URL, so a filtered view is shareable. */}
      <form method="get" className="mt-10 grid gap-4 border border-border-subtle bg-surface-sunken p-6 sm:grid-cols-2 lg:grid-cols-5">
        <Select label="Fund" name="fund" defaultValue={filters.fund ?? ''}>
          <option value="">All funds</option>
          {FUNDS.map((fund: Fund) => (
            <option key={fund} value={fund}>
              {FUND_LABELS[fund]}
            </option>
          ))}
        </Select>
        <Select label="Status" name="status" defaultValue={filters.status ?? ''}>
          <option value="">All statuses</option>
          {DONATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Select label="Source" name="source" defaultValue={filters.source ?? ''}>
          <option value="">All sources</option>
          {DONATION_SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </Select>
        <Input label="From" name="from" type="date" defaultValue={filters.from ?? ''} />
        <Input label="To" name="to" type="date" defaultValue={filters.to ?? ''} />
        <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-5">
          <Button type="submit" variant="primary" size="md">
            Apply filters
          </Button>
          <Button href="/admin/donations" variant="ghost" size="md">
            Clear
          </Button>
        </div>
      </form>

      <section aria-label="Fund totals" className="mt-8 border-y border-border-subtle py-6">
        <p className="eyebrow text-text-muted">
          Fund totals{filters.from || filters.to ? ' · filtered range' : ' · all time'}
        </p>
        {funds.length === 0 ? (
          <p className="mt-3 text-body-sm text-text-secondary">
            No succeeded gifts in this range.
          </p>
        ) : (
          <dl className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {funds.map((row) => (
              <div key={row.fund}>
                <dt className="text-body-sm text-text-secondary">
                  {row.fund in FUND_LABELS ? FUND_LABELS[row.fund as Fund] : row.fund}
                </dt>
                <dd className="mt-1 font-display text-heading tracking-display text-text-primary">
                  {formatUsd(row.totalCents)}
                </dd>
                <dd className="text-caption text-text-muted">
                  {row.count === 1 ? '1 gift' : `${row.count} gifts`}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section aria-label="Ledger" className="mt-8">
        {ledger.donations.length === 0 ? (
          <EmptyState
            icon={<HandHeart className="size-6" aria-hidden />}
            title="No gifts match"
            body={
              ledger.total === 0 && Object.keys(filters).length === 0
                ? 'The ledger is empty. Gifts appear here automatically as the Stripe webhook records them.'
                : 'No donations match these filters. Try widening the date range or clearing a filter.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-border-strong text-caption font-semibold uppercase tracking-eyebrow text-text-muted">
                  <th scope="col" className="py-3 pr-4 font-semibold">Date</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Email</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Fund</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Frequency</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Amount</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Fee</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Net</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Status</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Source</th>
                  <th scope="col" className="py-3 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ledger.donations.map((d) => (
                  <tr key={d.id} className="border-b border-border-subtle">
                    <td className="whitespace-nowrap py-3 pr-4 text-text-secondary">
                      {formatChicagoDate(d.createdAt)}
                    </td>
                    <td className="py-3 pr-4 text-text-primary">{d.donorEmail ?? '—'}</td>
                    <td className="py-3 pr-4 text-text-secondary">{d.fund ?? '—'}</td>
                    <td className="py-3 pr-4 text-text-secondary">{d.frequency ?? '—'}</td>
                    <td className="whitespace-nowrap py-3 pr-4 font-semibold text-text-primary">
                      {formatUsd(d.amountCents)}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-text-secondary">
                      {d.feeCents === null ? '—' : formatUsd(d.feeCents)}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-text-secondary">
                      {formatUsd(netCents(d))}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">{d.source}</td>
                    <td className="py-3 text-right">
                      {d.status === 'succeeded' && d.paymentIntentId && (
                        <RefundButton
                          paymentIntentId={d.paymentIntentId}
                          amountLabel={formatUsd(d.amountCents)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {ledger.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between gap-4">
            <p className="text-caption text-text-muted">
              {ledger.total} {ledger.total === 1 ? 'entry' : 'entries'}
            </p>
            <Pagination
              page={ledger.page}
              totalPages={ledger.totalPages}
              hrefFor={(p) => `/admin/donations${filterQuery(filters, { page: String(p) })}`}
            />
          </div>
        )}
      </section>
    </div>
  )
}
