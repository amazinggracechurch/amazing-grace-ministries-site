import { adminGuard } from '@/lib/admin/guard'
import { buildQrPayload, buildQrPdf, buildQrPng, buildQrSvg } from '@/lib/admin/qr'

/**
 * QR artwork for the giving flow. GET, admin-only.
 *
 *   /api/admin/qr?amount=50&fund=Missions&format=svg|png|pdf
 *
 * amount is human dollars (>= $1) and fund is a FUNDS enum value — the
 * same contract as /give/qr. svg and png are the raw artwork; pdf is a
 * three-page letter document (bulletin ~3in, foyer poster ~6in, screen
 * slide full-width).
 */
export async function GET(request: Request) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(request.url)
  const payload = buildQrPayload(
    searchParams.get('amount') ?? '',
    searchParams.get('fund') ?? ''
  )
  if (!payload) {
    return Response.json(
      { error: 'Amount must be at least $1 and fund must be one of the donation funds.' },
      { status: 400 }
    )
  }

  const format = searchParams.get('format') ?? 'svg'
  const base = `agm-give-${payload.fund.toLowerCase()}-${payload.amountCents}`

  try {
    if (format === 'svg') {
      return new Response(buildQrSvg(payload), {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Content-Disposition': `inline; filename="${base}.svg"`,
        },
      })
    }
    if (format === 'png') {
      const png = await buildQrPng(payload)
      return new Response(new Uint8Array(png), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${base}.png"`,
        },
      })
    }
    if (format === 'pdf') {
      const pdf = await buildQrPdf(payload)
      return new Response(pdf.buffer as ArrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${base}.pdf"`,
        },
      })
    }
    return Response.json({ error: 'format must be svg, png, or pdf.' }, { status: 400 })
  } catch (error) {
    console.error('[admin/qr] render failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not render the QR code.' }, { status: 500 })
  }
}
