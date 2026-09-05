// Seed the products collection with the first real merch item.
// Idempotent by slug — safe to re-run.
// Run: node --env-file=.env.local scripts/seed-products.mjs
//
// NOTE (spec §14.7): the image is a PLACEHOLDER — an existing worship
// photo, not product photography. Real product photos (and final prices)
// are a church supply item before launch.
import { cert, initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const products = [
  {
    title: 'AGM T-Shirt',
    slug: 'agm-t-shirt',
    description:
      'The Amazing Grace tee — soft, durable, and quietly bold. Represent the family wherever the week takes you. Pickup at Sunday service.',
    // PLACEHOLDER photo — replace with real product photography (spec §14.7).
    images: ['/images/worship-band-bw.jpg'],
    priceCents: 2500,
    category: 'Apparel',
    variants: [
      { id: 'v-small', name: 'Small', sku: 'AGM-TEE-S', stock: 10 },
      { id: 'v-medium', name: 'Medium', sku: 'AGM-TEE-M', stock: 15 },
      { id: 'v-large', name: 'Large', sku: 'AGM-TEE-L', stock: 8 },
    ],
    fulfillmentMethod: 'pickup',
    status: 'active',
    featured: true,
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

for (const product of products) {
  const existing = await db
    .collection('products')
    .where('slug', '==', product.slug)
    .limit(1)
    .get()

  if (existing.empty) {
    const ref = await db.collection('products').add({
      ...product,
      createdAt: new Date().toISOString(),
    })
    console.log(`created  ${product.slug}  (id: ${ref.id})`)
  } else {
    // Upsert editorial fields; never clobber stock that orders have moved.
    const doc = existing.docs[0]
    const current = doc.data()
    const mergedVariants = product.variants.map((seedVariant) => {
      const live = Array.isArray(current.variants)
        ? current.variants.find((v) => v && v.id === seedVariant.id)
        : null
      return live ? { ...seedVariant, stock: live.stock } : seedVariant
    })
    await doc.ref.update({ ...product, variants: mergedVariants })
    console.log(`updated  ${product.slug}  (id: ${doc.id})`)
  }
}

console.log('done —', products.length, 'product(s) seeded')
process.exit(0)
