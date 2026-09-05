/**
 * Firestore security-rules unit tests (@firebase/rules-unit-testing).
 *
 * Requires the Firestore emulator, which needs a Java runtime
 * (`brew install --cask temurin`). Run with:
 *
 *   FIRESTORE_EMULATOR_TESTS=1 npx vitest run tests/firestore.rules.test.ts
 *
 * Covers the build spec §7.1: anonymous users cannot read donations;
 * members read only their own pledges; only admins write projects,
 * events, posts, and products; nobody writes donations from the client.
 */
import { readFileSync } from 'node:fs'
import { describe, it, beforeAll, afterAll } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const RUN = process.env.FIRESTORE_EMULATOR_TESTS === '1'
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  if (!RUN) return
  testEnv = await initializeTestEnvironment({
    projectId: 'agm-rules-test',
    firestore: { rules },
  })
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    const seed = (path: string, data: Record<string, unknown>) => setDoc(doc(db, path), data)
    await seed('donations/d1', { userId: 'alice', amountCents: 5000 })
    await seed('pledges/p1', { userId: 'alice', amountCents: 10000 })
    await seed('pledges/p2', { userId: 'bob', amountCents: 2000 })
    await seed('projects/active1', { status: 'active', title: 'Roof fund' })
    await seed('projects/draft1', { status: 'draft', title: 'Secret project' })
    await seed('events/e1', { status: 'published', title: 'Open Heavens' })
    await seed('posts/post1', { status: 'published', publishAt: new Date(Date.now() - 86400_000) })
    await seed('products/prod1', { status: 'active', title: 'T-shirt' })
    await seed('users/alice', { email: 'alice@example.com', role: 'member' })
    await seed('orders/o1', { userId: 'alice', totalCents: 3000 })
  })
})

afterAll(async () => {
  if (RUN) await testEnv.cleanup()
})

describe.skipIf(!RUN)('firestore security rules', () => {
  it('anonymous users cannot read donations', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'donations/d1')))
  })

  it('signed-in members cannot read donations either (webhook/admin only)', async () => {
    const db = testEnv.authenticatedContext('alice').firestore()
    await assertFails(getDoc(doc(db, 'donations/d1')))
  })

  it('nobody can write donations from the client', async () => {
    const db = testEnv.authenticatedContext('alice', { role: 'admin' }).firestore()
    await assertFails(setDoc(doc(db, 'donations/d2'), { amountCents: 100 }))
  })

  it('a member reads only their own pledges', async () => {
    const db = testEnv.authenticatedContext('alice').firestore()
    await assertSucceeds(getDoc(doc(db, 'pledges/p1')))
    await assertFails(getDoc(doc(db, 'pledges/p2')))
  })

  it('a member reads only their own orders', async () => {
    const db = testEnv.authenticatedContext('alice').firestore()
    await assertSucceeds(getDoc(doc(db, 'orders/o1')))
    const other = testEnv.authenticatedContext('bob').firestore()
    await assertFails(getDoc(doc(other, 'orders/o1')))
  })

  it('anyone reads non-draft projects, only admins see drafts', async () => {
    const anon = testEnv.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(anon, 'projects/active1')))
    await assertFails(getDoc(doc(anon, 'projects/draft1')))
    const admin = testEnv.authenticatedContext('carol', { role: 'admin' }).firestore()
    await assertSucceeds(getDoc(doc(admin, 'projects/draft1')))
  })

  it('only admins can write projects, events, posts, products', async () => {
    const member = testEnv.authenticatedContext('alice').firestore()
    await assertFails(setDoc(doc(member, 'projects/x'), { status: 'active' }))
    await assertFails(setDoc(doc(member, 'events/x'), { status: 'published' }))
    await assertFails(setDoc(doc(member, 'posts/x'), { status: 'published' }))
    await assertFails(setDoc(doc(member, 'products/x'), { status: 'active' }))

    const admin = testEnv.authenticatedContext('carol', { role: 'admin' }).firestore()
    await assertSucceeds(setDoc(doc(admin, 'projects/x'), { status: 'active' }))
    await assertSucceeds(setDoc(doc(admin, 'events/x'), { status: 'published' }))
    await assertSucceeds(setDoc(doc(admin, 'posts/x'), { status: 'published' }))
    await assertSucceeds(setDoc(doc(admin, 'products/x'), { status: 'active' }))
  })

  it('published posts are public; settings are world-readable but admin-writable', async () => {
    const anon = testEnv.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(anon, 'posts/post1')))
    await assertSucceeds(getDoc(doc(anon, 'settings/site')))
    await assertFails(setDoc(doc(anon, 'settings/site'), { foo: 1 }))
  })
})
