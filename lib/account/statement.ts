import 'server-only'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { site } from '@/lib/site'
import type { MemberDonation } from '@/lib/account/member'
import { chicagoDateKey } from '@/lib/admin/giving'

/**
 * Annual giving statement PDF (spec §7.5) — a plain, letter-size document a
 * donor can attach to their tax records. Built with pdf-lib's standard
 * Helvetica fonts so there are no font assets to load.
 *
 * The EIN and 501(c)(3) status come from lib/site.ts (confirmed by the
 * church). The IRS-required "no goods or services" sentence is mandatory.
 */

const PAGE_WIDTH = 612 // US Letter, points
const PAGE_HEIGHT = 792
const MARGIN = 72
const ROW_HEIGHT = 18

const INK = rgb(0.15, 0.15, 0.15)
const MUTED = rgb(0.45, 0.45, 0.45)
const RULE = rgb(0.8, 0.8, 0.8)

/** Standard 14 fonts are WinAnsi-encoded — fold anything outside Latin-1. */
function sanitize(text: string): string {
  return (
    text
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
  )
}

/** cents -> "1,234.56" (no currency symbol — the column header carries it). */
function dollars(cents: number): string {
  return (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** "2026-01-31" -> "01/31/2026" */
function usDate(chicagoKey: string): string {
  const [y, m, d] = chicagoKey.split('-')
  return `${m}/${d}/${y}`
}

function drawRight(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number
) {
  page.drawText(text, { x: rightX - font.widthOfTextAtSize(text, size), y, font, size, color: INK })
}

export type StatementInput = {
  year: number
  donorName: string
  donorEmail: string | null
  /** Succeeded gifts in the statement year, ascending by date. */
  gifts: readonly MemberDonation[]
}

export async function buildGivingStatementPdf(input: StatementInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  const line = (text: string, options?: { font?: PDFFont; size?: number; color?: typeof INK; gap?: number }) => {
    const font = options?.font ?? regular
    const size = options?.size ?? 10
    page.drawText(sanitize(text), {
      x: MARGIN,
      y,
      font,
      size,
      color: options?.color ?? INK,
    })
    y -= options?.gap ?? size + 4
  }

  // --- letterhead ---
  line(site.name, { font: bold, size: 16, gap: 22 })
  line(site.address.street, { color: MUTED })
  line(`${site.address.city}, ${site.address.state} ${site.address.zip}`, { color: MUTED })
  line(site.contact.email, { color: MUTED })
  line(`EIN: ${site.ein}`, { color: MUTED })
  line(`Amazing Grace Ministries MN is ${site.taxStatus}.`, { color: MUTED, gap: 28 })

  line(`Annual Giving Statement - ${input.year}`, { font: bold, size: 13, gap: 20 })
  line(`Donor: ${input.donorName}`)
  if (input.donorEmail) line(input.donorEmail, { color: MUTED })
  y -= 10

  // --- gift table ---
  const colFund = MARGIN + 110
  const colAmountRight = PAGE_WIDTH - MARGIN

  const drawHeader = () => {
    page.drawText('Date', { x: MARGIN, y, font: bold, size: 10, color: INK })
    page.drawText('Fund', { x: colFund, y, font: bold, size: 10, color: INK })
    drawRight(page, 'Amount (USD)', colAmountRight, y, bold, 10)
    y -= 6
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: colAmountRight, y },
      thickness: 0.75,
      color: RULE,
    })
    y -= ROW_HEIGHT - 6
  }

  const ensureSpace = () => {
    if (y < MARGIN + ROW_HEIGHT * 2) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN
      drawHeader()
    }
  }

  drawHeader()
  let totalCents = 0
  for (const gift of input.gifts) {
    ensureSpace()
    totalCents += gift.amountCents
    page.drawText(usDate(chicagoDateKey(gift.createdAt)), {
      x: MARGIN,
      y,
      font: regular,
      size: 10,
      color: INK,
    })
    page.drawText(sanitize(gift.fund ?? 'General'), {
      x: colFund,
      y,
      font: regular,
      size: 10,
      color: INK,
    })
    drawRight(page, dollars(gift.amountCents), colAmountRight, y, regular, 10)
    y -= ROW_HEIGHT
  }

  ensureSpace()
  y -= 2
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: colAmountRight, y },
    thickness: 0.75,
    color: RULE,
  })
  y -= ROW_HEIGHT
  page.drawText(`Total (${giftCountLabel(input.gifts.length)})`, {
    x: MARGIN,
    y,
    font: bold,
    size: 10,
    color: INK,
  })
  drawRight(page, `$${dollars(totalCents)}`, colAmountRight, y, bold, 10)
  y -= ROW_HEIGHT * 2

  // --- IRS-required substantiation sentence (verbatim) ---
  ensureSpace()
  line('No goods or services were provided in exchange for these contributions.', {
    size: 10,
    gap: 18,
  })
  line(
    'Please retain this statement for your tax records. Gifts are listed by the date they were received (America/Chicago).',
    { size: 9, color: MUTED, gap: 14 }
  )
  line(
    `Generated ${usDate(chicagoDateKey(new Date().toISOString()))} by ${site.shortName}.`,
    { size: 9, color: MUTED }
  )

  return doc.save()
}

/** "3 gifts" / "1 gift" — kept as a helper so the total row reads naturally. */
function giftCountLabel(count: number): string {
  return count === 1 ? '1 gift' : `${count} gifts`
}
