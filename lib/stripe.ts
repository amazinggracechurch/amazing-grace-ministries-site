// SERVER-ONLY MODULE — holds the Stripe secret key. Never import this from
// a client component; the `server-only` package makes that a build error.
import 'server-only'
import Stripe from 'stripe'
import { env } from './env'

// Pinned to the stripe-node SDK's default API version at install time
// (stripe@22.6.1 -> 2026-08-26.dahlia). Note: this API version removed
// `Invoice.payment_intent`; the invoice's PaymentIntent client secret is
// exposed via `invoice.confirmation_secret` instead.
export const STRIPE_API_VERSION = '2026-08-26.dahlia'

const globalStore = globalThis as typeof globalThis & { __agmStripe?: Stripe }

/** Lazily created, HMR-safe singleton. Throws loudly if keys are missing. */
export function getStripe(): Stripe {
  if (!globalStore.__agmStripe) {
    globalStore.__agmStripe = new Stripe(env.stripe().STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
      appInfo: { name: 'amazing-grace-ministries-site' },
    })
  }
  return globalStore.__agmStripe
}
