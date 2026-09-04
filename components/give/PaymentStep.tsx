'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { formatUsd } from '@/lib/money'

/**
 * The payment step of the giving form. This module is dynamically imported
 * by GivingForm (ssr: false) so the Stripe.js SDK only ships to the give
 * page, and only after a PaymentIntent/Subscription client secret exists.
 */

// NEXT_PUBLIC_* is inlined at build time; the give page only renders this
// component when the server confirmed Stripe keys are present.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

/**
 * Appearance built from the design tokens (see app/globals.css).
 * The giving-form section is always dark (hard-coded `dark` wrapper),
 * so the Element always uses the dark token set — never the site theme.
 */
function appearanceFor(): StripeElementsOptions['appearance'] {
  return {
    theme: 'stripe',
    variables: {
      colorPrimary: '#5e9bf0',
      colorBackground: '#1a1a1a',
      colorText: '#f5f5f5',
      colorTextSecondary: '#c4c4c4',
      colorTextPlaceholder: '#9e9e9e',
      colorDanger: '#e0655a',
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSizeBase: '1rem',
      borderRadius: '0px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        border: '1px solid #2a2a2a',
        boxShadow: 'none',
      },
      '.Input:focus': {
        border: '1px solid #5e9bf0',
        boxShadow: 'none',
      },
      '.Label': {
        fontWeight: '600',
      },
    },
  }
}

type PaymentStepProps = {
  clientSecret: string
  totalCents: number
  submitSuffix: string
  /** Present for recurring gifts; forwarded to the confirmation page. */
  subscriptionId?: string
}

export default function PaymentStep(props: PaymentStepProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret: props.clientSecret, appearance: appearanceFor() }}
    >
      <ConfirmForm {...props} />
    </Elements>
  )
}

function ConfirmForm({ totalCents, submitSuffix, subscriptionId }: PaymentStepProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements || confirming) return
    setError(null)
    setConfirming(true)

    const returnUrl = new URL('/give/confirmation', window.location.origin)
    if (subscriptionId) returnUrl.searchParams.set('subscription', subscriptionId)

    // redirect: 'if_required' keeps cards without 3DS on-page; SCA/3DS
    // challenges are handled by Stripe's modal/redirect automatically.
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: { return_url: returnUrl.toString() },
    })

    if (result.error) {
      // Human-readable decline/validation message straight from Stripe.
      setError(result.error.message ?? 'Your payment could not be completed. Please try again.')
      setConfirming(false)
      return
    }

    const paymentIntent = result.paymentIntent
    if (
      paymentIntent &&
      (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')
    ) {
      returnUrl.searchParams.set('payment_intent', paymentIntent.id)
      router.push(`${returnUrl.pathname}${returnUrl.search}`)
      return
    }

    setError('Your payment needs another step — please try again.')
    setConfirming(false)
  }

  return (
    <form aria-label="Payment details" onSubmit={handleConfirm} className="flex flex-col gap-6">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && (
        <p role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={!stripe || confirming} className="w-full">
        {confirming ? (
          <>
            <Spinner size="sm" /> Processing…
          </>
        ) : (
          <>
            Give {formatUsd(totalCents)} {submitSuffix}
          </>
        )}
      </Button>
    </form>
  )
}
