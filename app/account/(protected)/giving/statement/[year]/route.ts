import { getSessionUser } from '@/lib/auth/session'
import { getMemberDonations, getMemberProfile } from '@/lib/account/member'
import { buildGivingStatementPdf } from '@/lib/account/statement'
import { chicagoDateKey } from '@/lib/admin/giving'

/**
 * GET /account/giving/statement/<year>
 *
 * Downloads the member's annual giving statement as a PDF. Session required —
 * a member can only ever generate their OWN statement: the donor identity and
 * the gift set both come from the verified session, never from the URL.
 */

export const runtime = 'nodejs'

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return errorResponse('Please sign in to download your giving statement.', 401)
  }

  const { year: raw } = await params
  const currentYear = Number(chicagoDateKey(new Date().toISOString()).slice(0, 4))
  if (!/^\d{4}$/.test(raw)) {
    return errorResponse('Invalid statement year.', 400)
  }
  const year = Number(raw)
  if (year < 2000 || year > currentYear) {
    return errorResponse('Invalid statement year.', 400)
  }

  try {
    const [donations, profile] = await Promise.all([
      getMemberDonations(user.uid, user.email),
      getMemberProfile(user.uid).catch(() => null),
    ])
    const gifts = donations
      .filter(
        (donation) =>
          donation.status === 'succeeded' &&
          chicagoDateKey(donation.createdAt).startsWith(String(year))
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    const pdf = await buildGivingStatementPdf({
      year,
      donorName: profile?.displayName ?? user.name ?? user.email ?? 'Donor',
      donorEmail: user.email,
      gifts,
    })

    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="agm-giving-statement-${year}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[account] statement generation failed', {
      year,
      message: error instanceof Error ? error.message : 'unknown',
    })
    return errorResponse('Something went wrong building your statement. Please try again.', 500)
  }
}
