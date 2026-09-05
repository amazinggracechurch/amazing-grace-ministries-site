import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { HandCoins } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import StatementYearSelect from '@/components/account/StatementYearSelect'
import { getSessionUser } from '@/lib/auth/session'
import {
  getMemberDonations,
  memberGivingYears,
  type MemberDonation,
} from '@/lib/account/member'
import { chicagoDateKey, formatChicagoDate } from '@/lib/admin/giving'
import { FUNDS, FUND_LABELS, type Fund } from '@/lib/donations/shared'
import { getProjectById, type Project } from '@/lib/projects'
import { formatUsd } from '@/lib/money'

export const metadata: Metadata = {
  title: 'Giving History | Amazing Grace Ministries MN',
  description: 'Your giving history, receipts, and annual statements.',
}

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 15
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type Filters = {
  fund?: string
  from?: string
  to?: string
}

function one(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

/** Anything unrecognized is dropped — filter params are never trusted blindly. */
function parseFilters(raw: Record<string, string | string[] | undefined>): Filters {
  const filters: Filters = {}
  const fund = one(raw.fund)
  if (fund && (FUNDS as readonly string[]).includes(fund)) filters.fund = fund
  const from = one(raw.from)
  if (from && DATE_KEY.test(from)) filters.from = from
  const to = one(raw.to)
  if (to && DATE_KEY.test(to)) filters.to = to
  return filters
}

function matches(donation: MemberDonation, filters: Filters): boolean {
  if (filters.fund && donation.fund !== filters.fund) return false
  if (filters.from || filters.to) {
    const key = chicagoDateKey(donation.createdAt)
    if (filters.from && key < filters.from) return false
    if (filters.to && key > filters.to) return false
  }
  return true
}

/** Querystring that preserves the active filters (page deliberately reset). */
function filterQuery(filters: Filters, extra: Record<string, string> = {}): string {
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

function fundLabel(fund: string | null): string {
  return fund && fund in FUND_LABELS ? FUND_LABELS[fund as Fund] : (fund ?? 'General')
}

function statusVariant(status: string): 'success' | 'neutral' {
  return status === 'succeeded' ? 'success' : 'neutral'
}

const STATUS_LABEL: Record<string, string> = {
  succeeded: 'Succeeded',
  failed: 'Failed',
  refunded: 'Refunded',
}

export default async function GivingPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  // The (protected) layout already enforced this; re-check so the page
  // never renders unauthenticated even if reused elsewhere.
  const user = await getSessionUser()
  if (!user) redirect('/account/signin?next=/account/giving')

  const raw = await searchParams
  const filters = parseFilters(raw)
  const requestedPage = Number(one(raw.page) ?? '1')
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

  let donations: MemberDonation[] = []
  try {
    donations = await getMemberDonations(user.uid, user.email)
  } catch (error) {
    console.error('[account] giving history failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
  }

  const filtered = donations.filter((donation) => matches(donation, filters))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Resolve project titles for designated gifts on this page only.
  const projectIds = [...new Set(rows.map((row) => row.projectId).filter((id): id is string => id !== null))]
  const projects = await Promise.all(
    projectIds.map((id) => getProjectById(id).catch(() => null))
  )
  const projectById = new Map(
    projects.filter((p): p is Project => p !== null).map((p) => [p.id, p])
  )

  const statementYears = memberGivingYears(donations)

  return (
    <main className="flex min-h-screen flex-col bg-surface font-body text-text-primary antialiased">
      <Navbar />
      <section className="flex-1 pt-32 pb-24 md:pt-40">
        <div className="mx-auto max-w-7xl px-6">
          <p className="eyebrow text-text-muted">Member Portal</p>
          <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
            Giving History
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-body text-text-secondary">
            Every gift recorded under your account — including gifts made with this email
            before you signed in. Dates are church-local (America/Chicago).
          </p>

          {statementYears.length > 0 && (
            <div className="mt-10 border border-border-subtle bg-surface-raised p-6 sm:p-8">
              <h2 className="eyebrow text-text-muted">Annual Giving Statement</h2>
              <p className="mt-3 max-w-2xl text-body-sm text-text-secondary">
                A PDF summary of your gifts for the year, for your tax records.
              </p>
              <div className="mt-5">
                <StatementYearSelect years={statementYears} />
              </div>
            </div>
          )}

          <form method="get" action="/account/giving" className="mt-10 flex flex-wrap items-end gap-4">
            <Select label="Fund" name="fund" defaultValue={filters.fund ?? ''} wrapperClassName="w-48">
              <option value="">All funds</option>
              {FUNDS.map((fund) => (
                <option key={fund} value={fund}>
                  {FUND_LABELS[fund]}
                </option>
              ))}
            </Select>
            <Input
              label="From"
              name="from"
              type="date"
              defaultValue={filters.from ?? ''}
              wrapperClassName="w-44"
            />
            <Input
              label="To"
              name="to"
              type="date"
              defaultValue={filters.to ?? ''}
              wrapperClassName="w-44"
            />
            <Button type="submit" variant="secondary">
              Filter
            </Button>
            {(filters.fund || filters.from || filters.to) && (
              <Button href="/account/giving" variant="ghost">
                Clear
              </Button>
            )}
          </form>

          <div className="mt-10">
            {donations.length === 0 ? (
              <EmptyState
                icon={<HandCoins className="size-6" aria-hidden />}
                title="No gifts yet"
                body="When you give — online or by scanning the QR code at church — your gifts will appear here with receipts and annual statements."
                action={<Button href="/give">Give now</Button>}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<HandCoins className="size-6" aria-hidden />}
                title="No gifts match these filters"
                body="Try a different fund or a wider date range."
                action={
                  <Button href="/account/giving" variant="secondary">
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto border border-border-subtle">
                  <table className="w-full min-w-[640px] border-collapse bg-surface-raised text-left text-body-sm">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        <th scope="col" className="px-4 py-3 text-caption font-semibold uppercase tracking-eyebrow text-text-muted">
                          Date
                        </th>
                        <th scope="col" className="px-4 py-3 text-caption font-semibold uppercase tracking-eyebrow text-text-muted">
                          Fund
                        </th>
                        <th scope="col" className="px-4 py-3 text-caption font-semibold uppercase tracking-eyebrow text-text-muted">
                          Project
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-caption font-semibold uppercase tracking-eyebrow text-text-muted">
                          Amount
                        </th>
                        <th scope="col" className="px-4 py-3 text-caption font-semibold uppercase tracking-eyebrow text-text-muted">
                          Method
                        </th>
                        <th scope="col" className="px-4 py-3 text-caption font-semibold uppercase tracking-eyebrow text-text-muted">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-caption font-semibold uppercase tracking-eyebrow text-text-muted">
                          Receipt
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((donation) => {
                        const project = donation.projectId
                          ? (projectById.get(donation.projectId) ?? null)
                          : null
                        return (
                          <tr
                            key={donation.id}
                            className="border-b border-border-subtle last:border-b-0"
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-text-primary">
                              {formatChicagoDate(donation.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-text-secondary">
                              {fundLabel(donation.fund)}
                            </td>
                            <td className="px-4 py-3 text-text-secondary">
                              {project ? (
                                <Link
                                  href={`/projects/${project.slug}`}
                                  className="text-accent transition-colors duration-200 hover:text-accent-hover"
                                >
                                  {project.title}
                                </Link>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-text-primary">
                              {formatUsd(donation.amountCents)}
                              {donation.coveredFee && donation.feeCents !== null && donation.feeCents > 0 && (
                                <span className="block text-caption font-normal text-text-muted">
                                  incl. {formatUsd(donation.feeCents)} fee
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-text-secondary">
                              {donation.method ?? '—'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={statusVariant(donation.status)}>
                                {STATUS_LABEL[donation.status] ?? donation.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {donation.status === 'succeeded' && donation.paymentIntentId ? (
                                <a
                                  href={`/account/giving/receipt/${donation.paymentIntentId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold text-accent transition-colors duration-200 hover:text-accent-hover"
                                >
                                  Receipt
                                </a>
                              ) : (
                                <span className="text-text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      page={currentPage}
                      totalPages={totalPages}
                      hrefFor={(p) => `/account/giving${filterQuery(filters, { page: String(p) })}`}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
