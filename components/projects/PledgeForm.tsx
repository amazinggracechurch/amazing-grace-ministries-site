'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import RadioGroup from '@/components/ui/RadioGroup'
import Spinner from '@/components/ui/Spinner'
import { formatUsd } from '@/lib/money'

const FREQUENCY_OPTIONS = [
  { value: 'one-time', label: 'One-time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
]

type PledgeFrequency = 'one-time' | 'monthly' | 'quarterly'

type Phase = 'form' | 'submitting' | 'success'

type PledgeFormProps = {
  projectSlug: string
}

/**
 * The member pledge form on a project page. Pledges are promises, not
 * payments — nothing is charged here; the member fulfills the pledge with
 * gifts over time, tracked in /account/pledges.
 */
export default function PledgeForm({ projectSlug }: PledgeFormProps) {
  const [amount, setAmount] = useState('')
  const [amountTouched, setAmountTouched] = useState(false)
  const [frequency, setFrequency] = useState<PledgeFrequency>('one-time')
  const [endDate, setEndDate] = useState('')
  const [phase, setPhase] = useState<Phase>('form')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const parsed = amount !== '' && !Number.isNaN(Number(amount)) ? Number(amount) : null
  const amountCents = parsed !== null && parsed >= 1 ? Math.round(parsed * 100) : null

  const amountError =
    amountTouched && amount !== '' && amountCents === null
      ? 'Enter a pledge of at least $1.'
      : undefined

  const handleAmountChange = (value: string) => {
    // Digits with an optional decimal point and up to two cents digits.
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value)
    }
  }

  const handleSubmit = async () => {
    if (amountCents === null || phase === 'submitting') return
    setSubmitError(null)
    setPhase('submitting')
    try {
      const res = await fetch('/api/pledges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug,
          amountCents,
          frequency,
          ...(endDate ? { endDate } : {}),
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
      }
      setPhase('success')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      )
      setPhase('form')
    }
  }

  if (phase === 'success') {
    return (
      <div className="border border-border-subtle bg-surface-raised p-6 sm:p-8">
        <p className="eyebrow text-accent">Pledge received</p>
        <p className="mt-4 font-display text-heading font-medium tracking-display text-text-primary">
          Thank you for standing with this work.
        </p>
        <p className="mt-3 text-body text-text-secondary">
          Your pledge of{' '}
          <span className="font-semibold text-text-primary">
            {amountCents !== null ? formatUsd(amountCents) : ''}
          </span>{' '}
          {frequency !== 'one-time' && `(${frequency}) `}
          is recorded. Give toward it whenever you are ready — every gift to this project counts
          against your pledge automatically.
        </p>
        <div className="mt-6">
          <Button variant="secondary" href="/account/pledges">
            Track my pledges
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      aria-label="Make a pledge"
      onSubmit={(e) => {
        e.preventDefault()
        void handleSubmit()
      }}
      className="flex flex-col gap-6 border border-border-subtle bg-surface-raised p-6 sm:p-8"
    >
      <RadioGroup
        legend="Pledge frequency"
        name="pledge-frequency"
        options={FREQUENCY_OPTIONS}
        value={frequency}
        onValueChange={(value) => setFrequency(value as PledgeFrequency)}
        direction="horizontal"
      />

      <Input
        label="Pledge amount"
        hint="A promise, not a payment — you will not be charged now."
        error={amountError}
        inputMode="decimal"
        placeholder="500"
        value={amount}
        onChange={(e) => handleAmountChange(e.target.value)}
        onBlur={() => setAmountTouched(true)}
      />

      <Input
        label="End date (optional)"
        hint={
          frequency === 'one-time'
            ? 'When you plan to complete this pledge.'
            : 'When this recurring pledge should end.'
        }
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />

      <div>
        <Button
          type="submit"
          size="lg"
          disabled={amountCents === null || phase === 'submitting'}
          onClick={() => void handleSubmit()}
          className="w-full"
        >
          {phase === 'submitting' ? (
            <>
              <Spinner size="sm" /> Recording your pledge…
            </>
          ) : (
            <>Pledge {amountCents !== null ? formatUsd(amountCents) : '—'}</>
          )}
        </Button>
        {submitError && (
          <p role="alert" className="mt-4 text-body-sm text-danger">
            {submitError}
          </p>
        )}
      </div>
    </form>
  )
}
