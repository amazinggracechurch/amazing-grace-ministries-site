'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import SectionHeading from '@/components/layout/SectionHeading'
import SplitSection from '@/components/layout/SplitSection'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import RadioGroup from '@/components/ui/RadioGroup'
import Reveal from '@/components/ui/Reveal'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import {
  FREQUENCIES,
  FREQUENCY_LABELS,
  FUNDS,
  FUND_LABELS,
  type Frequency,
  type IntentResponse,
} from '@/lib/donations/shared'
import { chargeTotalCents, feeCents, formatUsd } from '@/lib/money'

// The Stripe.js SDK only loads on this page, after a gift intent exists.
const PaymentStep = dynamic(() => import('./PaymentStep'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-8">
      <Spinner />
    </div>
  ),
})

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000]

const FREQUENCY_OPTIONS = FREQUENCIES.map((value) => ({
  value,
  label: FREQUENCY_LABELS[value],
}))

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

type Phase = 'form' | 'creating' | 'payment'

type GivingFormProps = {
  /** Server-detected Stripe configuration; when false the form stays in its pre-launch state. */
  stripeEnabled: boolean
}

/**
 * The giving form. Phase 1: validates and creates a PaymentIntent (one-time)
 * or Subscription (recurring) via /api/donations/intent — the client sends
 * amount/fund/frequency/coverFee/email, never a total. Phase 2: the Stripe
 * Payment Element mounts in the same aside, so the form simply grows a
 * payment section instead of navigating away.
 */
export default function GivingForm({ stripeEnabled }: GivingFormProps) {
  const [preset, setPreset] = useState<number | null>(50)
  const [custom, setCustom] = useState('')
  const [customTouched, setCustomTouched] = useState(false)
  const [fund, setFund] = useState<(typeof FUNDS)[number]>('Offering')
  const [frequency, setFrequency] = useState<Frequency>('one-time')
  const [coverFee, setCoverFee] = useState(false)
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [phase, setPhase] = useState<Phase>('form')
  const [payment, setPayment] = useState<IntentResponse | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const customParsed =
    custom !== '' && !Number.isNaN(Number(custom)) ? Number(custom) : null
  const rawAmount = preset ?? customParsed
  // A gift must be at least $1; anything below is treated as no amount.
  const amount = rawAmount !== null && rawAmount >= 1 ? rawAmount : null
  const amountCents = amount !== null ? Math.round(amount * 100) : null
  const fee = amountCents !== null ? feeCents(amountCents) : null
  const totalCents = amountCents !== null ? chargeTotalCents(amountCents, coverFee) : null

  const customError =
    customTouched && custom !== '' && amount === null
      ? 'Enter a gift of at least $1.'
      : undefined

  const emailRequired = frequency !== 'one-time'
  const emailError =
    (emailTouched || phase !== 'form') && emailRequired && email.trim() === ''
      ? 'An email address is required for recurring gifts.'
      : emailTouched && email.trim() !== '' && !EMAIL_PATTERN.test(email.trim())
        ? 'Please enter a valid email address.'
        : undefined

  const frequencyLabel = FREQUENCY_LABELS[frequency]
  const submitSuffix = frequency === 'one-time' ? 'Now' : frequencyLabel

  const handleCustomChange = (value: string) => {
    // Digits with an optional decimal point and up to two cents digits.
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustom(value)
      setPreset(null)
    }
  }

  const handleSubmit = async () => {
    if (!stripeEnabled || amountCents === null || phase === 'creating') return
    setEmailTouched(true)
    if (emailRequired && email.trim() === '') return
    if (email.trim() !== '' && !EMAIL_PATTERN.test(email.trim())) return

    setSubmitError(null)
    setPhase('creating')
    try {
      const res = await fetch('/api/donations/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents,
          fund,
          frequency,
          coverFee,
          email: email.trim() !== '' ? email.trim() : undefined,
          source: 'web',
        }),
      })
      const data = (await res.json()) as IntentResponse & { error?: string }
      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
      }
      setPayment(data)
      setPhase('payment')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      )
      setPhase('form')
    }
  }

  const handleBack = () => {
    setPayment(null)
    setPhase('form')
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
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSubmit()
                }}
                className="flex flex-col gap-8"
              >
                <RadioGroup
                  legend="Frequency"
                  name="frequency"
                  options={FREQUENCY_OPTIONS}
                  value={frequency}
                  onValueChange={(value) => setFrequency(value as Frequency)}
                  direction="horizontal"
                />

                <Select
                  label="Giving fund"
                  value={fund}
                  onChange={(e) => setFund(e.target.value as (typeof FUNDS)[number])}
                >
                  {FUNDS.map((value) => (
                    <option key={value} value={value}>
                      {FUND_LABELS[value]}
                    </option>
                  ))}
                </Select>

                <Input
                  label={emailRequired ? 'Email address' : 'Email address (optional)'}
                  hint={emailRequired ? 'Needed to set up your recurring gift.' : 'For your receipt.'}
                  error={emailError}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  required={emailRequired}
                />

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
                      {amountCents !== null ? formatUsd(amountCents) : '—'}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-text-secondary">Frequency</dt>
                    <dd className="font-semibold text-text-primary">{frequencyLabel}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-text-secondary">Fund</dt>
                    <dd className="text-right font-semibold text-text-primary">
                      {FUND_LABELS[fund]}
                    </dd>
                  </div>
                  {coverFee && fee !== null && (
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-text-secondary">Processing fee (2.9% + $0.30)</dt>
                      <dd className="font-semibold text-text-primary">{formatUsd(fee)}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-border-subtle pt-6">
                  <p className="text-body font-semibold text-text-primary">Total</p>
                  <p className="font-display text-heading font-medium text-text-primary">
                    {totalCents !== null ? formatUsd(totalCents) : '—'}
                  </p>
                </div>

                {phase === 'payment' && payment ? (
                  <div className="mt-8 border-t border-border-subtle pt-8">
                    <p className="mb-6 text-body-sm font-semibold text-text-primary">
                      Payment details
                    </p>
                    <PaymentStep
                      clientSecret={payment.clientSecret}
                      totalCents={payment.totalCents}
                      submitSuffix={submitSuffix}
                      subscriptionId={payment.subscriptionId}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4"
                      onClick={handleBack}
                    >
                      Edit gift details
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={!stripeEnabled || amountCents === null || phase === 'creating'}
                      onClick={() => void handleSubmit()}
                      className="mt-8 w-full"
                    >
                      {phase === 'creating' ? (
                        <>
                          <Spinner size="sm" /> Preparing secure payment…
                        </>
                      ) : (
                        <>
                          Give {totalCents !== null ? formatUsd(totalCents) : '—'} {submitSuffix}
                        </>
                      )}
                    </Button>
                    {submitError && (
                      <p role="alert" className="mt-4 text-body-sm text-danger">
                        {submitError}
                      </p>
                    )}
                    {stripeEnabled ? (
                      <p className="mt-4 text-caption text-text-muted">
                        Payments are processed securely by Stripe. Your card details never touch
                        our servers.
                      </p>
                    ) : (
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
                    )}
                  </>
                )}
              </div>
            }
          />
        </Reveal>
      </div>
    </section>
  )
}
