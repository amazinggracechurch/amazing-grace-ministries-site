import { revalidatePath } from 'next/cache'
import { adminGuard } from '@/lib/admin/guard'
import { recordAudit } from '@/lib/audit'
import { clearManualVideoIdsCache, getRecentSermons } from '@/lib/youtube'

/**
 * Force-refresh the sermon cache. POST, admin-only. Clears the manual-ID
 * module cache, pulls a fresh sermon list through getRecentSermons (which
 * also refreshes the last-good Firestore snapshot), revalidates the public
 * pages that render sermons, and reports what was fetched.
 */
export async function POST() {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  try {
    clearManualVideoIdsCache()
    const sermons = await getRecentSermons(10)
    revalidatePath('/')
    revalidatePath('/sermons')

    await recordAudit({
      actorUid: guard.user.uid,
      actorEmail: guard.user.email,
      action: 'refresh_cache',
      collection: 'settings',
      docId: 'youtube',
      after: { fetched: sermons.length },
    })

    return Response.json({
      ok: true,
      count: sermons.length,
      sermons: sermons.map((sermon) => ({ id: sermon.id, title: sermon.title })),
    })
  } catch (error) {
    console.error('[admin/sermons] refresh failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Refresh failed. Please try again.' }, { status: 500 })
  }
}
