// Seed the events collection from the three events previously hardcoded in
// components/home/EventsRail.tsx. Idempotent by slug — safe to re-run.
// Run: node --env-file=.env.local scripts/seed-events.mjs
//
// Dates are the next occurrence relative to 2026-09-04, in America/Chicago
// (CDT, -05:00): next Sunday Celebration, next 1st-Saturday Open Heavens,
// and Community Groups kicking off next month.
import { cert, initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const CHURCH_ADDRESS = '715 Edgerton Street, Saint Paul, MN 55130'

const events = [
  {
    slug: 'community-groups',
    title: 'Community Groups',
    description:
      'Build authentic faith friendships in our weekly small groups. Groups meet online and in homes across the Twin Cities — there is a seat for you.',
    startAt: '2026-10-05T19:00:00-05:00',
    endAt: '2026-10-05T20:30:00-05:00',
    location: { name: 'Online & In Person', address: CHURCH_ADDRESS },
    capacity: 30,
    priceCents: null,
    featured: false,
  },
  {
    slug: 'open-heavens',
    title: 'Open Heavens',
    description:
      'Start the month with a supercharge of prayer. Open Heavens is our monthly corporate prayer gathering where we come together as the Amazing Family to seek God, pray fervently, and set our minds in tune with Him.',
    startAt: '2026-10-03T09:00:00-05:00',
    endAt: '2026-10-03T11:00:00-05:00',
    location: { name: 'Main Sanctuary', address: CHURCH_ADDRESS },
    capacity: null,
    priceCents: null,
    featured: true,
  },
  {
    slug: 'sunday-celebration',
    title: 'Sunday Celebration',
    description:
      'Join our weekly family gathering — Spirit-filled worship, powerful teaching from Pastor Uchegbu, and real community. All are welcome, in person and online.',
    startAt: '2026-09-06T09:00:00-05:00',
    endAt: '2026-09-06T11:00:00-05:00',
    location: { name: 'Sanctuary', address: CHURCH_ADDRESS },
    capacity: null,
    priceCents: null,
    featured: false,
  },
]

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

for (const event of events) {
  const existing = await db
    .collection('events')
    .where('slug', '==', event.slug)
    .limit(1)
    .get()

  const fields = {
    title: event.title,
    slug: event.slug,
    flyerImage: null,
    description: event.description,
    startAt: event.startAt,
    endAt: event.endAt,
    timezone: 'America/Chicago',
    location: event.location,
    capacity: event.capacity,
    priceCents: event.priceCents,
    status: 'published',
    featured: event.featured,
    updatedAt: FieldValue.serverTimestamp(),
  }

  if (existing.empty) {
    const ref = await db.collection('events').add({
      ...fields,
      rsvpCount: 0,
      createdAt: new Date().toISOString(),
    })
    console.log(`created  ${event.slug}  (id: ${ref.id})  ${event.startAt}`)
  } else {
    // Upsert: never clobber the live RSVP count or the original createdAt.
    await existing.docs[0].ref.update(fields)
    console.log(`updated  ${event.slug}  (id: ${existing.docs[0].id})  ${event.startAt}`)
  }
}

console.log('done —', events.length, 'events seeded')
process.exit(0)
