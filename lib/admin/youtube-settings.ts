import 'server-only'
import { adminDb } from '@/lib/firebase/admin'

/**
 * The Firestore-managed manual YouTube override list (`settings/youtube`
 * doc: { manualVideoIds: string[] }). This is the uncached admin-side
 * accessor; the public read path lives in lib/youtube.ts with a 5-minute
 * module cache.
 */

const DOC = 'settings/youtube'

export async function readManualVideoIds(): Promise<string[]> {
  const doc = await adminDb().doc(DOC).get()
  if (!doc.exists) return []
  const raw: unknown = doc.get('manualVideoIds')
  return Array.isArray(raw)
    ? raw
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.trim())
        .filter(Boolean)
    : []
}

export async function writeManualVideoIds(ids: string[]): Promise<void> {
  await adminDb()
    .doc(DOC)
    .set({ manualVideoIds: ids, updatedAt: new Date().toISOString() })
}
