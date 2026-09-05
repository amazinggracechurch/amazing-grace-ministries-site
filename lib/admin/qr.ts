import 'server-only'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { env } from '@/lib/env'
import { FUNDS, FUND_LABELS, type Fund } from '@/lib/donations/shared'
import { formatUsd, parseUsdToCents } from '@/lib/money'

/**
 * QR payload + artwork builder (spec §6.4). The encoded URL mirrors the
 * /give/qr route contract exactly: amount in human dollars (>= $1),
 * fund one of the FUNDS enum values.
 */

export const QR_CAPTION = 'Give — Amazing Grace Ministries'

export type QrPayload = {
  url: string
  amountCents: number
  fund: Fund
}

/** Validate amount/fund and build the URL the QR encodes. Null when invalid. */
export function buildQrPayload(amountParam: string, fundParam: string): QrPayload | null {
  const amountCents = parseUsdToCents(amountParam)
  if (amountCents === null || amountCents < 100) return null
  if (!(FUNDS as readonly string[]).includes(fundParam)) return null
  const fund = fundParam as Fund
  // Normalize the amount ("25.5" stays "25.5"; the /give/qr parser accepts it).
  const url = `${env.siteUrl()}/give/qr?amount=${amountCents / 100}&fund=${fund}`
  return { url, amountCents, fund }
}

/** Raw QR module matrix at error-correction level H. */
function qrMatrix(url: string) {
  return QRCode.create(url, { errorCorrectionLevel: 'H' }).modules
}

function loadLogoDataUri(): string | null {
  try {
    const svg = readFileSync(path.join(process.cwd(), 'public', 'logo-dark.svg'))
    return `data:image/svg+xml;base64,${svg.toString('base64')}`
  } catch {
    return null
  }
}

/**
 * SVG artwork: dark modules on white, the church logo centered over the
 * code (level H tolerates the occlusion), and the caption line below.
 * Vector throughout — the logo is inlined as a data URI so the file is
 * self-contained for print shops.
 */
export function buildQrSvg(payload: QrPayload): string {
  const matrix = qrMatrix(payload.url)
  const modules = matrix.size
  const margin = 4
  const total = modules + margin * 2
  const captionHeight = 6 // module-units of caption strip below the code
  const width = total
  const height = total + captionHeight

  let pathData = ''
  for (let row = 0; row < modules; row += 1) {
    for (let col = 0; col < modules; col += 1) {
      if (matrix.get(row, col)) {
        pathData += `M${col + margin} ${row + margin}h1v1h-1z`
      }
    }
  }

  const logoDataUri = loadLogoDataUri()
  const logoSize = Math.round(total * 0.22)
  const logoX = (width - logoSize) / 2
  const logoY = (total - logoSize) / 2

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="QR code: ${QR_CAPTION}">`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    `<path d="${pathData}" fill="#1a1a1a"/>`,
    logoDataUri
      ? `<rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" fill="#ffffff"/>` +
        `<image href="${logoDataUri}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}"/>`
      : '',
    `<text x="${width / 2}" y="${total + captionHeight / 2 + 1}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="2.6" fill="#1a1a1a">${QR_CAPTION}</text>`,
    `</svg>`,
  ].join('')
}

/** PNG of the code (plain, no overlay — qrcode.toBuffer keeps it simple). */
export async function buildQrPng(payload: QrPayload): Promise<Buffer> {
  return QRCode.toBuffer(payload.url, {
    errorCorrectionLevel: 'H',
    width: 1200,
    margin: 4,
  })
}

/**
 * Print-ready PDF: letter pages with the QR centered, caption, church
 * name, and the gift details. One page per use case — bulletin insert
 * (~3in), foyer poster (~6in), screen slide (full width).
 */
export async function buildQrPdf(payload: QrPayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const png = await pdf.embedPng(await buildQrPng(payload))
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const PAGE_W = 612
  const PAGE_H = 792
  const SIZES: { label: string; points: number }[] = [
    { label: 'Bulletin insert', points: 3 * 72 },
    { label: 'Foyer poster', points: 6 * 72 },
    { label: 'Screen slide', points: PAGE_W - 2 * 36 },
  ]
  const detail = `${formatUsd(payload.amountCents)} · ${FUND_LABELS[payload.fund]}`
  const black = rgb(0.1, 0.1, 0.1)
  const CHURCH_NAME = 'Amazing Grace Ministries'

  for (const { label, points } of SIZES) {
    const page = pdf.addPage([PAGE_W, PAGE_H])
    const size = Math.min(points, PAGE_W - 72)

    // Stack: church name / QR / caption / detail / use-case label.
    const nameSize = 18
    const captionSize = 13
    const detailSize = 11
    const labelSize = 9
    const nameWidth = bold.widthOfTextAtSize(CHURCH_NAME, nameSize)
    const captionWidth = bold.widthOfTextAtSize(QR_CAPTION, captionSize)
    const detailWidth = font.widthOfTextAtSize(detail, detailSize)
    const labelWidth = font.widthOfTextAtSize(label, labelSize)

    const stackHeight = nameSize + 24 + size + 16 + captionSize + 10 + detailSize + 30 + labelSize
    let y = (PAGE_H + stackHeight) / 2

    y -= nameSize
    page.drawText(CHURCH_NAME, {
      x: (PAGE_W - nameWidth) / 2,
      y,
      size: nameSize,
      font: bold,
      color: black,
    })
    y -= 24 + size
    page.drawImage(png, { x: (PAGE_W - size) / 2, y, width: size, height: size })
    y -= 16 + captionSize
    page.drawText(QR_CAPTION, {
      x: (PAGE_W - captionWidth) / 2,
      y,
      size: captionSize,
      font: bold,
      color: black,
    })
    y -= 10 + detailSize
    page.drawText(detail, {
      x: (PAGE_W - detailWidth) / 2,
      y,
      size: detailSize,
      font,
      color: black,
    })
    y -= 30 + labelSize
    page.drawText(label, {
      x: (PAGE_W - labelWidth) / 2,
      y,
      size: labelSize,
      font,
      color: rgb(0.45, 0.45, 0.45),
    })
  }

  return pdf.save()
}
