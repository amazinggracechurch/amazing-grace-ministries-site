/**
 * Money helpers — integer cents only, everywhere. No floats ever cross
 * the API boundary; the one place a float appears is the percentage
 * multiplication below, and its result is always rounded back to an
 * integer cent immediately.
 */

/** Stripe US card processing: 2.9% + $0.30, charged on the CHARGED amount. */
const FEE_PERCENT = 0.029
const FEE_FIXED_CENTS = 30

/** The fee Stripe would take on a given charge total, in integer cents. */
function stripeFeeOn(totalCents: number): number {
  return Math.round(totalCents * FEE_PERCENT) + FEE_FIXED_CENTS
}

/**
 * The fee a donor must add to `amountCents` so that, after Stripe takes its
 * cut of the TOTAL charge, the ministry still nets the full gift.
 *
 * Stripe's fee applies to the charged total, not the gift, so a naive
 * `round(amount * 0.029) + 30` under-covers. We need the `total` satisfying
 *
 *   total - fee(total) >= amount,   where fee(t) = round(0.029 * t) + 30
 *
 * Ignoring cent rounding, total = (amount + 30) / (1 - 0.029). Cent rounding
 * inside fee() can push the net a cent short, so we start from the ceil of
 * that closed form and nudge up until the inequality holds (at most a
 * couple of iterations in practice). Returns `total - amountCents`.
 */
export function feeCents(amountCents: number): number {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
    throw new RangeError('feeCents expects a non-negative integer cent amount')
  }
  if (amountCents === 0) return 0
  let total = Math.ceil((amountCents + FEE_FIXED_CENTS) / (1 - FEE_PERCENT))
  while (total - stripeFeeOn(total) < amountCents) total += 1
  return total - amountCents
}

/** What the donor is actually charged for a gift, honoring the cover-fee choice. */
export function chargeTotalCents(amountCents: number, coverFee: boolean): number {
  return coverFee ? amountCents + feeCents(amountCents) : amountCents
}

/** 123456 -> "$1,234.56" */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100
  )
}

/**
 * Parse a human-entered dollar string ("25", "$1,234.56", "0.99") to integer
 * cents. Returns null for anything that isn't a plain non-negative dollar
 * amount with at most two decimal places.
 */
export function parseUsdToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^\$/, '').replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const cents = Math.round(Number(cleaned) * 100)
  return Number.isSafeInteger(cents) ? cents : null
}
