import { describe, expect, it, vi } from 'vitest'
import { inflateSync } from 'node:zlib'
import { PDFDocument } from 'pdf-lib'

// The module under test is server-only in the Next build; in unit tests the
// marker package would throw on import, so it is stubbed out.
vi.mock('server-only', () => ({}))

import { buildGivingStatementPdf } from './statement'
import type { MemberDonation } from './member'

/** pdf-lib Flate-compresses content streams — inflate them to search text. */
function pdfText(pdf: Uint8Array): string {
  const raw = Buffer.from(pdf)
  const chunks: string[] = []
  let index = 0
  for (;;) {
    const start = raw.indexOf('stream\n', index)
    if (start === -1) break
    const end = raw.indexOf('endstream', start)
    try {
      chunks.push(inflateSync(raw.subarray(start + 7, end)).toString('latin1'))
    } catch {
      // Not a compressed stream — ignore.
    }
    index = end + 9
  }
  // Glyphs are drawn as hex strings (<416D…> Tj) — decode them to text.
  return chunks
    .join('\n')
    .replace(/<([0-9A-Fa-f]+)>/g, (_match, hex: string) =>
      Buffer.from(hex, 'hex').toString('latin1')
    )
}

function gift(overrides: Partial<MemberDonation> = {}): MemberDonation {
  return {
    id: 'd1',
    eventId: 'evt_1',
    paymentIntentId: 'pi_1',
    subscriptionId: null,
    amountCents: 10000,
    baseAmountCents: 10000,
    feeCents: 0,
    fund: 'Tithes',
    frequency: 'one-time',
    donorEmail: 'jane@example.org',
    coveredFee: false,
    source: 'web',
    status: 'succeeded',
    createdAt: '2026-03-14T15:00:00.000Z',
    userId: 'u1',
    projectId: null,
    method: null,
    subscriptionStatus: null,
    ...overrides,
  }
}

describe('buildGivingStatementPdf', () => {
  it('produces a valid PDF containing the IRS sentence and EIN placeholder', async () => {
    const pdf = await buildGivingStatementPdf({
      year: 2026,
      donorName: 'Jane Donor',
      donorEmail: 'jane@example.org',
      gifts: [gift(), gift({ id: 'd2', fund: 'Missions', amountCents: 2500 })],
    })
    // %PDF magic bytes.
    expect(String.fromCharCode(...pdf.slice(0, 4))).toBe('%PDF')
    const text = pdfText(pdf)
    expect(text).toContain(
      'No goods or services were provided in exchange for these contributions.'
    )
    expect(text).toContain('EIN: [to be confirmed by the church]')
    expect(text).toContain('Annual Giving Statement - 2026')
    // Total row: 100.00 + 25.00.
    expect(text).toContain('$125.00')
  })

  it('folds non-WinAnsi characters instead of throwing', async () => {
    const pdf = await buildGivingStatementPdf({
      year: 2026,
      donorName: 'Adaeze “Ada” Okafor — 北京',
      donorEmail: null,
      gifts: [gift()],
    })
    expect(String.fromCharCode(...pdf.slice(0, 4))).toBe('%PDF')
  })

  it('paginates long gift lists', async () => {
    const gifts = Array.from({ length: 80 }, (_, i) =>
      gift({ id: `d${i}`, createdAt: `2026-01-${String((i % 28) + 1).padStart(2, '0')}T15:00:00.000Z` })
    )
    const pdf = await buildGivingStatementPdf({
      year: 2026,
      donorName: 'Jane Donor',
      donorEmail: 'jane@example.org',
      gifts,
    })
    const parsed = await PDFDocument.load(pdf)
    expect(parsed.getPageCount()).toBeGreaterThan(1)
  })
})
