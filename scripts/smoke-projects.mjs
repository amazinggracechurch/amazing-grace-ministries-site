// One-off: create (and later delete) a temporary funding project so the
// /projects pages can be verified against real Firestore data.
// Run: node --env-file=.env.local scripts/smoke-projects.mjs create|delete
import { cert, initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

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
const SLUG = 'smoke-test-project'

const command = process.argv[2]

if (command === 'create') {
  const now = new Date()
  const end = new Date(now.getTime() + 30 * 86_400_000)
  const ref = await db.collection('projects').add({
    title: 'Smoke Test Project',
    slug: SLUG,
    description:
      'A temporary project used to verify the funding-pages build.\n\nIt will be deleted as soon as verification is complete.',
    coverImage: null,
    gallery: [],
    goalAmountCents: 250_000,
    raisedAmountCents: 62_500,
    pledgedAmountCents: 50_000,
    donorCount: 12,
    startDate: now.toISOString(),
    endDate: end.toISOString(),
    status: 'active',
    featured: false,
    sortOrder: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  })
  console.log('created project', ref.id)
  console.log('verify: http://localhost:3000/projects and http://localhost:3000/projects/' + SLUG)
} else if (command === 'delete') {
  const snapshot = await db.collection('projects').where('slug', '==', SLUG).get()
  if (snapshot.empty) {
    console.log('nothing to delete')
  } else {
    const batch = db.batch()
    snapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
    console.log('deleted', snapshot.size, 'project doc(s)')
  }
} else {
  console.error('usage: node --env-file=.env.local scripts/smoke-projects.mjs create|delete')
  process.exit(1)
}
process.exit(0)
