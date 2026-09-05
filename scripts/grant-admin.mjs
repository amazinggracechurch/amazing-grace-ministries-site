#!/usr/bin/env node
/**
 * Grant (or revoke) the admin role for a member account.
 *
 * Usage:
 *   node --env-file=.env.local scripts/grant-admin.mjs <email>
 *   node --env-file=.env.local scripts/grant-admin.mjs <email> --revoke
 *
 * PREREQUISITE: the account must already exist — the person must have
 * signed in at least once at /account/signin, which creates both the
 * Firebase Auth user and the users/{uid} Firestore doc.
 *
 * What it does:
 *   1. Looks up the Firebase Auth user by email.
 *   2. Sets custom claims to exactly { role: 'admin' } (or 'member' with
 *      --revoke) — this REPLACES any other custom claims by design.
 *   3. Upserts users/{uid}.role to match (Firestore mirror for display
 *      and queries; the custom claim on the token is the source of truth
 *      that security rules and server layouts check).
 *
 * NOTE: role claims only reach the session cookie when the person next
 * signs in (or when their token refreshes and a new session cookie is
 * minted). Tell them to sign out and back in if /admin doesn't open
 * right away.
 */
import { cert, initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const args = process.argv.slice(2)
const revoke = args.includes('--revoke')
const email = args.find((a) => !a.startsWith('--'))
const role = revoke ? 'member' : 'admin'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

if (!email || !EMAIL_PATTERN.test(email)) {
  console.error('Usage: node --env-file=.env.local scripts/grant-admin.mjs <email> [--revoke]')
  process.exit(1)
}

for (const key of [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
]) {
  if (!process.env[key]) {
    console.error(`Missing ${key} — run with: node --env-file=.env.local ...`)
    process.exit(1)
  }
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })

const auth = getAuth(app)
const db = getFirestore(app)

let user
try {
  user = await auth.getUserByEmail(email)
} catch (err) {
  if (err?.errorInfo?.code === 'auth/user-not-found' || err?.code === 'auth/user-not-found') {
    console.error(
      `No Firebase Auth user for ${email}.\n` +
        'The account must exist first — have them sign in once at /account/signin, then re-run this script.'
    )
    process.exit(1)
  }
  throw err
}

await auth.setCustomUserClaims(user.uid, { role })

await db.collection('users').doc(user.uid).set(
  {
    email: user.email ?? email,
    role,
    roleUpdatedAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
)

console.log(`${revoke ? 'Revoked admin from' : 'Granted admin to'} ${email}`)
console.log(`  uid:              ${user.uid}`)
console.log(`  custom claims:    { role: '${role}' } (all other claims replaced)`)
console.log(`  users/${user.uid}.role = '${role}'`)
console.log('They must sign out and back in for the new role to reach their session.')
