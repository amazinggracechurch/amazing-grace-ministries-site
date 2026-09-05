import { z } from 'zod'
import { getSessionUser } from '@/lib/auth/session'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { fullName, nameFields } from '@/lib/names'

/**
 * POST /api/account/profile
 *
 * Updates the signed-in member's profile. Session required; the body is
 * zod-validated and MERGED into users/{uid} — role, email, and other
 * account fields are never touched here. The Firebase Auth display name is
 * updated best-effort so future sessions pick it up.
 */

export const runtime = 'nodejs'

const profileSchema = z.object({
  ...nameFields,
  phone: z.string().trim().max(40).default(''),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker (YYYY-MM-DD).')
    .or(z.literal(''))
    .default(''),
  interests: z.array(z.string().max(60)).max(20).default([]),
  communicationPrefs: z.object({
    emailUpdates: z.boolean(),
    pledgeReminders: z.boolean(),
  }),
})

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return errorResponse('Please sign in to update your profile.', 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body.', 400)
  }

  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid profile details.', 400)
  }

  const { firstName, lastName, phone, birthdate, interests, communicationPrefs } = parsed.data
  // displayName stays in sync for Firebase Auth and readers that predate
  // the firstName/lastName split.
  const displayName = fullName(firstName, lastName)

  try {
    await adminDb()
      .collection('users')
      .doc(user.uid)
      .set(
        {
          firstName,
          lastName,
          displayName,
          phone: phone || null,
          birthdate: birthdate || null,
          interests,
          communicationPrefs,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
    // Best-effort: keeps future session cookies in sync; the Firestore
    // write above is the source of truth for the portal.
    await adminAuth()
      .updateUser(user.uid, { displayName })
      .catch(() => undefined)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[account] profile update failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return errorResponse('Something went wrong saving your profile. Please try again.', 500)
  }
}
