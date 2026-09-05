import 'server-only'
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'
import { env } from '@/lib/env'

/**
 * Firebase Admin SDK — SERVER ONLY. Never import from client components.
 * Initialized from the service-account values in env; used by route
 * handlers for every privileged operation (donations, RSVPs, admin).
 */

let app: App | null = null

function adminApp(): App {
  if (app) return app
  if (getApps().length > 0) {
    app = getApps()[0]!
    return app
  }
  const config = env.firebaseAdmin()
  app = initializeApp({
    credential: cert({
      projectId: config.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: config.FIREBASE_ADMIN_CLIENT_EMAIL,
      // dotenv keeps the PEM's literal \n sequences; cert wants real ones.
      privateKey: config.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
  return app
}

export function adminDb(): Firestore {
  return getFirestore(adminApp())
}

export function adminAuth(): Auth {
  return getAuth(adminApp())
}

export function adminBucket() {
  return getStorage(adminApp()).bucket(
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  )
}
