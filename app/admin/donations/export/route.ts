import type { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin/guard'
import { listAllDonations, parseDonationFilters } from '@/lib/admin/donations'
import { donationsToCsv } from '@/lib/admin/giving'

/**
 * GET /admin/donations/export?<same filters as the ledger>
 *
 * Downloads the filtered ledger as a QuickBooks-friendly CSV. Lives under
 * /admin (not /api) so the export link is a plain anchor next to the ledger
 * filters; the role check is identical to the /api/admin/* routes.
 */

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  const params = request.nextUrl.searchParams
  const filters = parseDonationFilters({
    fund: params.get('fund') ?? undefined,
    source: params.get('source') ?? undefined,
    status: params.get('status') ?? undefined,
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
  })

  const donations = await listAllDonations(filters)
  const csv = donationsToCsv(donations)
  const today = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="donations-${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
