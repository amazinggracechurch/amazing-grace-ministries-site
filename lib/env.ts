import { z } from 'zod'

/**
 * Environment validation. Validated per domain, lazily — a missing
 * Firebase key must not break the public site build, but a missing
 * Stripe key must crash the donations route loudly and by name.
 *
 * Server-only vars are never read from client components; the zod
 * schemas keep NEXT_PUBLIC_* and secret vars strictly separate.
 */

const stripeServerSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required'),
})

const youtubeSchema = z.object({
  YOUTUBE_API_KEY: z.string().min(1, 'YOUTUBE_API_KEY is required'),
  YOUTUBE_CHANNEL_ID: z.string().min(1, 'YOUTUBE_CHANNEL_ID is required'),
})

const resendSchema = z.object({
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),
  CONTACT_INBOX: z.string().min(1, 'CONTACT_INBOX is required'),
})

function parse<T>(schema: z.ZodType<T>, domain: string): T {
  const result = schema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    throw new Error(`[env] ${domain} configuration invalid — ${missing}`)
  }
  return result.data
}

export const env = {
  stripe: () => parse(stripeServerSchema, 'Stripe'),
  /**
   * All configured webhook signing secrets. Several may exist at once —
   * e.g. a test-mode endpoint during development and the production
   * endpoint carried over from the previous site
   * (PROD_STRIPE_WEBHOOK_SECRET), so launch day is only a URL edit in
   * Stripe. The receiver tries each. Throws if none are configured.
   */
  stripeWebhookSecrets: (): string[] => {
    const secrets = [
      process.env.STRIPE_WEBHOOK_SECRET,
      process.env.PROD_STRIPE_WEBHOOK_SECRET,
    ].filter((v): v is string => typeof v === 'string' && v.length > 0)
    if (secrets.length === 0) {
      throw new Error(
        '[env] Stripe webhook configuration invalid — set STRIPE_WEBHOOK_SECRET (test/CLI) and/or PROD_STRIPE_WEBHOOK_SECRET'
      )
    }
    return secrets
  },
  youtube: () => parse(youtubeSchema, 'YouTube'),
  resend: () => parse(resendSchema, 'Resend'),
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amazinggracemn.org',
}

/** True when a domain's vars are present — for graceful degradation. */
export const has = {
  stripe: () => stripeServerSchema.safeParse(process.env).success,
  stripeWebhook: () =>
    Boolean(process.env.STRIPE_WEBHOOK_SECRET || process.env.PROD_STRIPE_WEBHOOK_SECRET),
  youtube: () => youtubeSchema.safeParse(process.env).success,
  resend: () => resendSchema.safeParse(process.env).success,
}
