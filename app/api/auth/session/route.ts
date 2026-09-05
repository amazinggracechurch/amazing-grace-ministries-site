import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

/**
 * Session-cookie exchange — the security backbone of member auth (spec §7.2).
 *
 * POST { idToken }
 *   Verifies the Firebase ID token, upserts the users/{uid} profile (created
 *   on first-ever sign-in, lastSeenAt refreshed on every sign-in), backfills
 *   userId onto prior donations made under the same email, then mints a
 *   5-day Firebase session cookie returned as Set-Cookie: __session.
 *
 * DELETE
 *   Clears the cookie. Always 200 — sign-out must never fail visibly.
 *
 * The cookie contract lives here AND in lib/auth/session.ts (the reader);
 * keep the two in sync.
 */

export const runtime = 'nodejs'

const SESSION_COOKIE_NAME = '__session'
/** 5 days, in milliseconds (Firebase allows 5 minutes – 14 days). */
const SESSION_TTL_MS = 5 * 24 * 60 * 60 * 1000
/** Firestore batches cap at 500 writes; stay well under. */
const BACKFILL_CHUNK = 400

const bodySchema = z.object({
  idToken: z.string().min(1),
})

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

/**
 * First sign-in creates the profile; later sign-ins refresh lastSeenAt and
 * the provider-sourced fields (name/photo/email can change upstream).
 * `role` is never touched here — only scripts/grant-admin.mjs changes it.
 */
async function upsertUserProfile(decoded: {
  uid: string
  email?: string
  name?: string
  picture?: string
}) {
  const userRef = adminDb().collection('users').doc(decoded.uid)
  const snapshot = await userRef.get()
  const profile = {
    email: decoded.email ?? null,
    displayName: decoded.name ?? null,
    photoURL: decoded.picture ?? null,
  }
  if (!snapshot.exists) {
    await userRef.set({
      ...profile,
      role: 'member',
      stripeCustomerId: null,
      createdAt: FieldValue.serverTimestamp(),
      lastSeenAt: FieldValue.serverTimestamp(),
    })
  } else {
    await userRef.set(
      { ...profile, lastSeenAt: FieldValue.serverTimestamp() },
      { merge: true }
    )
  }
}

/**
 * Donation backfill: gifts recorded before the account existed carry
 * `donorEmail` but `userId: null`. Link them on every sign-in so giving
 * history is never empty for a returning donor.
 */
async function backfillDonations(uid: string, email: string | undefined) {
  if (!email) return
  const unlinked = await adminDb()
    .collection('donations')
    .where('donorEmail', '==', email)
    .where('userId', '==', null)
    .get()
  if (unlinked.empty) return
  for (let i = 0; i < unlinked.docs.length; i += BACKFILL_CHUNK) {
    const batch = adminDb().batch()
    for (const doc of unlinked.docs.slice(i, i + BACKFILL_CHUNK)) {
      batch.update(doc.ref, { userId: uid })
    }
    await batch.commit()
  }
}

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }

  let decoded
  try {
    decoded = await adminAuth().verifyIdToken(parsed.data.idToken)
  } catch {
    return Response.json({ error: 'invalid_token' }, { status: 401 })
  }

  try {
    await upsertUserProfile(decoded)
    await backfillDonations(decoded.uid, decoded.email)
  } catch {
    return Response.json({ error: 'profile_sync_failed' }, { status: 500 })
  }

  let sessionCookie: string
  try {
    sessionCookie = await adminAuth().createSessionCookie(parsed.data.idToken, {
      expiresIn: SESSION_TTL_MS,
    })
  } catch {
    return Response.json({ error: 'session_create_failed' }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(
    SESSION_COOKIE_NAME,
    sessionCookie,
    cookieOptions(SESSION_TTL_MS / 1000)
  )
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE_NAME, '', cookieOptions(0))
  return response
}
