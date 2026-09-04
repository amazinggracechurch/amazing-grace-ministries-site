'use client'
import { useState } from 'react'
import Link from 'next/link'
import SectionHeading from '@/components/layout/SectionHeading'
import SplitSection from '@/components/layout/SplitSection'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import RadioGroup from '@/components/ui/RadioGroup'
import Reveal from '@/components/ui/Reveal'
import Select from '@/components/ui/Select'
import { cn } from '@/lib/cn'

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000]

const FUNDS = [
  'General Fund',
  'Building Fund',
  'Missions & Outreach',
  'Youth Ministry',
  'Benevolence Fund',
]

const FREQUENCIES = [
  { value: 'one-time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
]

/** Stripe-style card processing fee: 2.9% + $0.30. */
const FEE_RATE = 0.029
const FEE_FIXED = 0.3

function formatUSD(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

/**
 * The giving form — a complete, controlled flow ready for the Stripe
 * Payment Element to slot into the submit step. Until the API keys land,
 * the submit button stays disabled and the caption says so honestly.
 */
export default function GivingForm() {
  const [preset, setPreset] = useState<number | null>(50)
  const [custom, setCustom] = useState('')
  const [customTouched, setCustomTouched] = useState(false)
  const [fund, setFund] = useState('General Fund')
  const [frequency, setFrequency] = useState('one-time')
  const [coverFee, setCoverFee] = useState(false)

  const customParsed =
    custom !== '' && !Number.isNaN(Number(custom)) ? Number(custom) : null
  const rawAmount = preset ?? customParsed
  // A gift must be at least $1; anything below is treated as no amount.
  const amount = rawAmount !== null && rawAmount >= 1 ? rawAmount : null
  const fee = amount !== null ? amount * FEE_RATE + FEE_FIXED : null
  const total = amount !== null ? (coverFee && fee !== null ? amount + fee : amount) : null

  const customError =
    customTouched && custom !== '' && amount === null
      ? 'Enter a gift of at least $1.'
      : undefined

  const frequencyLabel =
    FREQUENCIES.find((f) => f.value === frequency)?.label ?? 'One-time'
  const submitSuffix = frequency === 'one-time' ? 'Now' : frequencyLabel

  const handleCustomChange = (value: string) => {
    // Digits with an optional decimal point and up to two cents digits.
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustom(value)
      setPreset(null)
    }
  }

  return (
    <section id="giving-form" className="dark bg-surface text-text-primary">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <Reveal>
          <SectionHeading
            eyebrow="Partner With Us"
            title="Give Online"
            lede="Your generosity fuels everything we do — from Sunday services to community outreach. Thank you for partnering with us."
          />
        </Reveal>

        <Reveal delay={1} className="mt-14">
          <SplitSection
            main={
              <form
                aria-label="Online giving"
                onSubmit={(e) => e.preventDefault()}
                className="flex flex-col gap-8"
              >
                <RadioGroup
                  legend="Frequency"
                  name="frequency"
                  options={FREQUENCIES}
                  value={frequency}
                  onValueChange={setFrequency}
                  direction="horizontal"
                />

                <Select
                  label="Giving fund"
                  value={fund}
                  onChange={(e) => setFund(e.target.value)}
                >
                  {FUNDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>

                <fieldset>
                  <legend className="mb-1 text-body-sm font-semibold text-text-primary">
                    Select amount
                  </legend>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {PRESET_AMOUNTS.map((amt) => {
                      const selected = preset === amt
                      return (
                        <button
                          key={amt}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            setPreset(amt)
                            setCustom('')
                            setCustomTouched(false)
                          }}
                          className={cn(
                            'border px-3 py-3 text-body font-semibold transition-colors duration-200',
                            selected
                              ? 'border-accent bg-accent text-on-accent'
                              : 'border-border-strong bg-surface-raised text-text-primary hover:border-accent hover:text-accent'
                          )}
                        >
                          ${amt.toLocaleString('en-US')}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-4">
                    <Input
                      label="Custom amount"
                      hint="Minimum gift is $1."
                      error={customError}
                      inputMode="decimal"
                      placeholder="Enter custom amount"
                      value={custom}
                      onChange={(e) => handleCustomChange(e.target.value)}
                      onBlur={() => setCustomTouched(true)}
                    />
                  </div>
                </fieldset>

                <Checkbox
                  label="Cover the processing fee"
                  hint="Adds 2.9% + $0.30 so the full amount of your gift reaches the ministry."
                  checked={coverFee}
                  onChange={(e) => setCoverFee(e.target.checked)}
                />
              </form>
            }
            aside={
              <div className="border border-border-subtle bg-surface-raised p-6 sm:p-8">
                <p className="eyebrow text-text-muted">Your Gift</p>
                <dl className="mt-6 flex flex-col gap-4 text-body">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-text-secondary">Gift amount</dt>
                    <dd className="font-semibold text-text-primary">
                      {amount !== null ? formatUSD(amount) : '—'}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-text-secondary">Frequency</dt>
                    <dd className="font-semibold text-text-primary">{frequencyLabel}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-text-secondary">Fund</dt>
                    <dd className="text-right font-semibold text-text-primary">{fund}</dd>
                  </div>
                  {coverFee && fee !== null && (
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-text-secondary">Processing fee (2.9% + $0.30)</dt>
                      <dd className="font-semibold text-text-primary">{formatUSD(fee)}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-border-subtle pt-6">
                  <p className="text-body font-semibold text-text-primary">Total</p>
                  <p className="font-display text-heading font-medium text-text-primary">
                    {total !== null ? formatUSD(total) : '—'}
                  </p>
                </div>

                {/* TODO: enable when the Stripe Payment Element lands with API keys. */}
                <Button
                  type="submit"
                  size="lg"
                  disabled
                  className="mt-8 w-full"
                >
                  Give {total !== null ? formatUSD(total) : '—'} {submitSuffix}
                </Button>
                <p className="mt-4 text-caption text-text-muted">
                  Online giving launches soon. Give in person on Sundays, or{' '}
                  <Link
                    href="/contact"
                    className="font-semibold text-accent underline-offset-4 transition-colors duration-200 hover:text-accent-hover hover:underline"
                  >
                    contact us
                  </Link>{' '}
                  and we will help you give another way.
                </p>
              </div>
            }
          />
        </Reveal>
      </div>
    </section>
  )
}
