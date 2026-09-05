import type { Metadata } from 'next'
import { UsersRound } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import MemberRoleSelect from '@/components/admin/MemberRoleSelect'
import { listMembers, memberGiving, type GivingTotal } from '@/lib/admin/members'
import { getSessionUser } from '@/lib/auth/session'
import { has } from '@/lib/env'
import { formatUsd } from '@/lib/money'

export const metadata: Metadata = {
  title: 'Members | Admin | Amazing Grace Ministries MN',
  description: 'Member accounts, roles, and giving history.',
}

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function one(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function roleVariant(role: string): 'accent' | 'neutral' {
  return role === 'member' ? 'neutral' : 'accent'
}

function memberSince(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  // The layout guarantees an admin session; re-read for the actor's role.
  const actor = await getSessionUser()
  if (!actor) return null
  const isSuperadmin = actor.role === 'superadmin'

  const raw = await searchParams
  const query = one(raw.query)
  const requestedPage = Number(one(raw.page) ?? '1')
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

  if (!has.firebaseAdmin()) {
    return (
      <div>
        <p className="eyebrow text-text-muted">Admin · Members</p>
        <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
          Members<span className="text-accent">.</span>
        </h1>
        <div className="mt-12">
          <EmptyState
            icon={<UsersRound className="size-6" aria-hidden />}
            title="Firebase Admin is not configured"
            body="Add the FIREBASE_ADMIN_* service-account variables to .env.local to manage members."
          />
        </div>
      </div>
    )
  }

  const [result, giving] = await Promise.all([
    listMembers({ query, page, pageSize: PAGE_SIZE }),
    memberGiving(),
  ])

  // Superadmins are invisible to ordinary admins — they must not see the
  // role, let alone change it (the API route enforces the same rule).
  const members = isSuperadmin
    ? result.members
    : result.members.filter((m) => m.role !== 'superadmin')

  const givingFor = (uid: string, email: string | null): GivingTotal | undefined =>
    giving.byUid.get(uid) ?? (email ? giving.byEmail.get(email.toLowerCase()) : undefined)

  const pageHref = (p: number) => {
    const params = new URLSearchParams()
    if (query) params.set('query', query)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/admin/members${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      <p className="eyebrow text-text-muted">Admin · Members</p>
      <h1 className="mt-4 font-display text-display-md font-light uppercase tracking-display text-text-primary">
        Members<span className="text-accent">.</span>
      </h1>

      {/* GET form — the search lives in the URL. */}
      <form method="get" className="mt-10 flex flex-wrap items-end gap-3">
        <Input
          label="Search members"
          name="query"
          type="search"
          placeholder="Name or email"
          defaultValue={query ?? ''}
          wrapperClassName="min-w-64 flex-1"
        />
        <Button type="submit" variant="primary" size="md">
          Search
        </Button>
        {query && (
          <Button href="/admin/members" variant="ghost" size="md">
            Clear
          </Button>
        )}
      </form>

      <section aria-label="Member list" className="mt-8">
        {members.length === 0 ? (
          <EmptyState
            icon={<UsersRound className="size-6" aria-hidden />}
            title={query ? 'No members match' : 'No members yet'}
            body={
              query
                ? `Nobody matches "${query}". Check the spelling or search by email instead.`
                : 'Member accounts appear here the first time someone signs in.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-border-strong text-caption font-semibold uppercase tracking-eyebrow text-text-muted">
                  <th scope="col" className="py-3 pr-4 font-semibold">Member</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Since</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Role</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Giving</th>
                  <th scope="col" className="py-3 font-semibold">
                    <span className="sr-only">Change role</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const total = givingFor(member.uid, member.email)
                  const label = member.displayName ?? member.email ?? member.uid
                  const isSelf = member.uid === actor.uid
                  return (
                    <tr key={member.uid} className="border-b border-border-subtle">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-text-primary">
                          {member.displayName ?? '—'}
                        </p>
                        <p className="text-caption text-text-muted">{member.email ?? '—'}</p>
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-text-secondary">
                        {memberSince(member.createdAt)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={roleVariant(member.role)}>{member.role}</Badge>
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-text-secondary">
                        {total
                          ? `${formatUsd(total.totalCents)} · ${total.count === 1 ? '1 gift' : `${total.count} gifts`}`
                          : '—'}
                      </td>
                      <td className="py-3 text-right">
                        {isSelf ? (
                          <span className="text-caption text-text-muted">You</span>
                        ) : (
                          <MemberRoleSelect
                            uid={member.uid}
                            memberLabel={label}
                            currentRole={member.role}
                            allowSuperadmin={isSuperadmin}
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {result.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between gap-4">
            <p className="text-caption text-text-muted">
              {result.total} {result.total === 1 ? 'member' : 'members'}
            </p>
            <Pagination page={result.page} totalPages={result.totalPages} hrefFor={pageHref} />
          </div>
        )}
      </section>
    </div>
  )
}
