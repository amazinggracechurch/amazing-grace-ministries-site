import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Signed tokens for "manage your RSVP" links — lets a guest cancel
 * without an account. The signing key is derived from the Admin SDK
 * private key (already server-only, already present) so no extra env
 * var is needed.
 */

function signingKey(): string {
  return createHmac('sha256', 'agm-rsvp-token')
    .update(process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? 'unconfigured')
    .digest('hex')
}

export function signRsvpToken(rsvpId: string): string {
  return createHmac('sha256', signingKey()).update(rsvpId).digest('base64url')
}

export function verifyRsvpToken(rsvpId: string, token: string): boolean {
  const expected = Buffer.from(signRsvpToken(rsvpId))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
