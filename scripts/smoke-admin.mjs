// One-off: verify the Firebase Admin SDK works against the real project.
// Run: node --env-file=.env.local scripts/smoke-admin.mjs
import { cert, initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })

const db = getFirestore(app)
const ref = db.collection('_smoke').doc('admin-write-test')
await ref.set({ ok: true, at: FieldValue.serverTimestamp() })
const snap = await ref.get()
console.log('write+read OK:', snap.exists, snap.data().ok)
await ref.delete()
console.log('delete OK')
process.exit(0)
