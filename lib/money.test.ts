import { describe, expect, it } from 'vitest'
import { chargeTotalCents, feeCents, formatUsd, parseUsdToCents } from './money'

// Mirror of Stripe's fee rule, used to verify the solver end-to-end.
function stripeFeeOn(totalCents: number): number {
  return Math.round(totalCents * 0.029) + 30
}

describe('feeCents', () => {
  it('covers the fee on the charged amount for the $1 minimum gift', () => {
    // total = 134; Stripe takes round(134*0.029)+30 = 4+30 = 34; net = 100.
    expect(feeCents(100)).toBe(34)
    const total = 100 + feeCents(100)
    expect(total - stripeFeeOn(total)).toBe(100)
  })

  it('computes known values', () => {
    // total 2606; Stripe takes round(2606*0.029)+30 = 76+30 = 106; net = 2500.
    expect(feeCents(2500)).toBe(106)
    const total = 2500 + feeCents(2500)
    expect(total - stripeFeeOn(total)).toBe(2500)
  })

  it('is zero for a zero gift', () => {
    expect(feeCents(0)).toBe(0)
  })

  it('rejects non-integers and negatives', () => {
    expect(() => feeCents(10.5)).toThrow(RangeError)
    expect(() => feeCents(-100)).toThrow(RangeError)
  })

  it('net always covers the gift, overcharging by at most one cent', () => {
    for (let amount = 100; amount <= 20000; amount += 1) {
      const total = amount + feeCents(amount)
      const overage = total - stripeFeeOn(total) - amount
      expect(overage).toBeGreaterThanOrEqual(0)
      expect(overage).toBeLessThanOrEqual(1)
    }
  })

  it('handles large gifts', () => {
    const amount = 1_000_000_00 // $1,000,000
    const total = amount + feeCents(amount)
    expect(total - stripeFeeOn(total)).toBeGreaterThanOrEqual(amount)
  })
})

describe('chargeTotalCents', () => {
  it('passes the amount through when the fee is not covered', () => {
    expect(chargeTotalCents(5000, false)).toBe(5000)
  })

  it('adds the fee when covered', () => {
    expect(chargeTotalCents(5000, true)).toBe(5000 + feeCents(5000))
  })
})

describe('formatUsd', () => {
  it('formats cents as USD', () => {
    expect(formatUsd(100)).toBe('$1.00')
    expect(formatUsd(2500)).toBe('$25.00')
    expect(formatUsd(123456)).toBe('$1,234.56')
    expect(formatUsd(0)).toBe('$0.00')
    expect(formatUsd(99)).toBe('$0.99')
  })
})

describe('parseUsdToCents', () => {
  it('parses plain dollars', () => {
    expect(parseUsdToCents('25')).toBe(2500)
    expect(parseUsdToCents('0.99')).toBe(99)
    expect(parseUsdToCents('1')).toBe(100)
  })

  it('parses dollars with cents, $ signs, and commas', () => {
    expect(parseUsdToCents('25.50')).toBe(2550)
    expect(parseUsdToCents('$25.50')).toBe(2550)
    expect(parseUsdToCents('1,234.56')).toBe(123456)
    expect(parseUsdToCents('$1,234')).toBe(123400)
    expect(parseUsdToCents(' 50 ')).toBe(5000)
  })

  it('rejects malformed input', () => {
    expect(parseUsdToCents('')).toBeNull()
    expect(parseUsdToCents('abc')).toBeNull()
    expect(parseUsdToCents('25.555')).toBeNull()
    expect(parseUsdToCents('-5')).toBeNull()
    expect(parseUsdToCents('.5')).toBeNull()
    expect(parseUsdToCents('25.')).toBeNull()
    expect(parseUsdToCents('$')).toBeNull()
    expect(parseUsdToCents('1.2.3')).toBeNull()
  })
})
