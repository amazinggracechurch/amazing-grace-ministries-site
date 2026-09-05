import { z } from 'zod'

/**
 * Shared name helpers — client-safe (no server-only imports).
 *
 * Name capture is standardized to firstName + lastName everywhere (contact,
 * profile, RSVP, shop checkout). `displayName` / `name` fields are still
 * written alongside for Firebase Auth and readers that predate the split;
 * `splitDisplayName` migrates those legacy single-field values on read.
 */

/** "First Last" — trims both parts and tolerates either being empty/null. */
export function fullName(first?: string | null, last?: string | null): string {
  return [first, last]
    .map((part) => part?.trim() ?? '')
    .filter((part) => part.length > 0)
    .join(' ')
}

/**
 * Best-effort split of a legacy single-field name: first word is the first
 * name, the rest is the last name. Nulls when there is nothing to give.
 */
export function splitDisplayName(displayName: string | null | undefined): {
  firstName: string | null
  lastName: string | null
} {
  const parts = (displayName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: null, lastName: null }
  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  }
}

/** Zod fragment spread into every schema that captures a person's name. */
export const nameFields = {
  firstName: z.string().trim().min(1, 'Please enter your first name.').max(60),
  lastName: z.string().trim().min(1, 'Please enter your last name.').max(60),
}
