'use client'
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

/**
 * Firebase client SDK — auth state and public reads from the browser.
 * All writes of consequence happen server-side via the Admin SDK;
 * security rules are deny-by-default regardless.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | null = null

function clientApp(): FirebaseApp {
  if (app) return app
  app = getApps().length > 0 ? getApps()[0]! : initializeApp(config)
  return app
}

export function clientAuth(): Auth {
  return getAuth(clientApp())
}

export function clientDb(): Firestore {
  return getFirestore(clientApp())
}
