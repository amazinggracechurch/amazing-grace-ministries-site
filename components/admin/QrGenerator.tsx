'use client'
import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FUNDS, FUND_LABELS, type Fund } from '@/lib/donations/shared'
import { parseUsdToCents } from '@/lib/money'

/**
 * QR generator (spec §6.4): fund + amount → giving URL → artwork rendered
 * by /api/admin/qr. The preview is the SVG itself; downloads cover SVG,
 * PNG, and a three-page print PDF.
 */
export default function QrGenerator() {
  const [fund, setFund] = useState<Fund>('Offering')
  const [amount, setAmount] = useState('50')

  const amountCents = useMemo(() => parseUsdToCents(amount), [amount])
  const valid = amountCents !== null && amountCents >= 100

  const query = valid
    ? `amount=${encodeURIComponent(amount.trim())}&fund=${encodeURIComponent(fund)}`
    : null
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amazinggracemn.org'
  const encodedUrl = valid ? `${siteUrl}/give/qr?amount=${amountCents / 100}&fund=${fund}` : null

  return (
    <div className="mt-10 grid max-w-4xl gap-10 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <Select
          label="Fund"
          value={fund}
          onChange={(event) => setFund(event.target.value as Fund)}
        >
          {FUNDS.map((value) => (
            <option key={value} value={value}>
              {FUND_LABELS[value]}
            </option>
          ))}
        </Select>
        <Input
          label="Amount (USD)"
          required
          inputMode="decimal"
          value={amount}
          error={!valid && amount.trim() !== '' ? 'Enter at least $1.' : undefined}
          onChange={(event) => setAmount(event.target.value)}
        />
        {encodedUrl && (
          <div>
            <p className="text-body-sm font-semibold text-text-primary">Encoded URL</p>
            <p className="mt-1 break-all border border-border-subtle bg-surface-sunken px-3 py-2 text-body-sm text-text-secondary">
              {encodedUrl}
            </p>
            <p className="mt-1 text-caption text-text-muted">
              Scanners land on a Stripe Checkout page for this exact gift.
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            href={query ? `/api/admin/qr?${query}&format=svg` : '/api/admin/qr'}
            variant="secondary"
            size="sm"
            disabled={!query}
          >
            <Download className="size-4" aria-hidden="true" />
            SVG
          </Button>
          <Button
            href={query ? `/api/admin/qr?${query}&format=png` : '/api/admin/qr'}
            variant="secondary"
            size="sm"
            disabled={!query}
          >
            <Download className="size-4" aria-hidden="true" />
            PNG
          </Button>
          <Button
            href={query ? `/api/admin/qr?${query}&format=pdf` : '/api/admin/qr'}
            variant="secondary"
            size="sm"
            disabled={!query}
          >
            <Download className="size-4" aria-hidden="true" />
            Print PDF
          </Button>
        </div>
        <p className="text-caption text-text-muted">
          The PDF has three letter pages: bulletin insert (~3in), foyer poster (~6in), and a
          full-width screen slide.
        </p>
      </div>

      <div>
        <p className="text-body-sm font-semibold text-text-primary">Preview</p>
        <div className="mt-2 border border-border-subtle bg-surface-raised p-6">
          {query ? (
            // eslint-disable-next-line @next/next/no-img-element -- server-rendered SVG artwork, not a static asset
            <img
              src={`/api/admin/qr?${query}&format=svg`}
              alt={`QR code preview for ${FUND_LABELS[fund]}`}
              className="mx-auto w-full max-w-72"
            />
          ) : (
            <p className="py-16 text-center text-body-sm text-text-muted">
              Enter a valid amount to preview the QR code.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
