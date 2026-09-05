/**
 * Seed the Firestore `posts` collection with sample blog content.
 *
 * Usage (from site/):
 *   node --env-file=.env.local scripts/seed-posts.mjs
 *
 * Idempotent by slug: existing posts are updated in place, missing ones
 * created, so the script is safe to re-run. Uses the Firebase Admin SDK
 * (bypasses Firestore rules); never prints credential values.
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const REQUIRED = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
]
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[seed-posts] missing env var: ${key} (run with --env-file=.env.local)`)
    process.exit(1)
  }
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
const db = getFirestore(app)

const PASTOR = 'Pastor Nnaemeka Uchegbu'

// NOTE: body copy below is DRAFTED PLACEHOLDER text, written in the
// church's voice so the feature can be reviewed end-to-end. The church
// should replace it with the real sermon manuscript / announcement copy
// via the admin editor when it ships.
const posts = [
  {
    type: 'sermon',
    title: 'The Promise Is Still Yes',
    slug: 'the-promise-is-still-yes',
    excerpt:
      'God is not a man, that He should lie. What He has spoken over your life, He is faithful to perform — a word for everyone still waiting on the promise.',
    body: [
      {
        type: 'paragraph',
        text: 'Some of us walked into this year carrying a word from God that has not yet come to pass. The diagnosis is still there. The door is still closed. The prayer you prayed in January has not been answered in August. And the enemy has been whispering the same question he asked in the garden: did God really say? Today I came to tell you — He said it, and He has not changed His mind. The promise is still yes.',
      },
      {
        type: 'scripture',
        text: 'God is not a man, that he should lie; neither the son of man, that he should repent: hath he said, and shall he not do it? or hath he spoken, and shall he not make it good?',
        reference: 'Numbers 23:19',
      },
      {
        type: 'heading',
        level: 2,
        text: 'God is not a man, that He should lie',
      },
      {
        type: 'paragraph',
        text: 'Balaam stood on that mountain hired to curse Israel, and even a prophet for hire could not reverse what God had blessed. Hear me: no witchcraft, no gossip, no layoff, no disappointment can overturn the word of the Lord over your life. Men change their minds. Circumstances change their faces. But God is not a man. His yes does not expire while you are waiting.',
      },
      {
        type: 'pullquote',
        text: 'The delay is not a denial. God’s calendar is not behind — it is preparing you for what it is preparing for you.',
      },
      {
        type: 'paragraph',
        text: 'So what do we do while we wait? We keep showing up. We keep serving. We keep confessing the promise over our homes, our children, our health, and this church. Abraham waited twenty-five years for Isaac and staggered not at the promise of God through unbelief. If He said it, He will do it. If He spoke it, He will make it good. Lift your hands and tell somebody: the promise is still yes.',
      },
    ],
    coverImage: '/images/sermon-pulpit.jpg',
    author: { name: PASTOR },
    speaker: PASTOR,
    scriptureRef: 'Numbers 23:19',
    series: 'Living in the Promise',
    tags: ['faith', 'promise', 'waiting on God'],
    status: 'published',
    publishAt: '2026-08-09T14:00:00.000Z',
    seo: {
      description:
        'Sermon text from Pastor Nnaemeka Uchegbu on Numbers 23:19 — why God’s promise over your life has not expired while you wait.',
    },
  },
  {
    type: 'announcement',
    title: 'Open Heavens — Monthly Prayer Gathering',
    slug: 'open-heavens-monthly-prayer-gathering',
    excerpt:
      'Join us in the Main Sanctuary on the first Saturday of every month for Open Heavens — a morning of corporate prayer to start the month in tune with God.',
    body: [
      {
        type: 'paragraph',
        text: 'Every month has a gate, and we believe in meeting it with prayer. Open Heavens is our monthly corporate prayer gathering, held on the first Saturday of every month in the Main Sanctuary. It is a powerful time to start the month with prayer and set your mind in tune with God — and all are welcome.',
      },
      {
        type: 'paragraph',
        text: 'Come expecting. We worship, we pray over our families, our city, and the month ahead, and we make room for the Holy Spirit to move. Whether you have prayed all your life or you are just learning, there is a place for you in the room.',
      },
      {
        type: 'heading',
        level: 2,
        text: 'What to know before you come',
      },
      {
        type: 'list',
        style: 'bullet',
        items: [
          'First Saturday of every month, in the Main Sanctuary',
          '715 Edgerton Street, Saint Paul, MN 55130',
          'All are welcome — bring a friend and your prayer requests',
          'Doors are open early; come as you are',
        ],
      },
      {
        type: 'scripture',
        text: 'Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not.',
        reference: 'Jeremiah 33:3',
      },
    ],
    coverImage: '/images/community-choir.jpg',
    author: { name: 'Amazing Grace Ministries' },
    tags: ['prayer', 'open heavens', 'monthly rhythm'],
    status: 'published',
    publishAt: '2026-08-28T15:00:00.000Z',
    seo: {
      description:
        'Open Heavens, the monthly prayer gathering of Amazing Grace Ministries MN, meets on the first Saturday of every month in the Main Sanctuary.',
    },
  },
]

const now = new Date().toISOString()
const collection = db.collection('posts')

for (const post of posts) {
  const existing = await collection.where('slug', '==', post.slug).limit(1).get()
  if (existing.empty) {
    const ref = await collection.add({ ...post, createdAt: now, updatedAt: now })
    console.log(`[seed-posts] created  ${post.slug} (id: ${ref.id})`)
  } else {
    const ref = existing.docs[0].ref
    await ref.update({ ...post, updatedAt: now })
    console.log(`[seed-posts] updated  ${post.slug} (id: ${ref.id})`)
  }
}

console.log('[seed-posts] done')
