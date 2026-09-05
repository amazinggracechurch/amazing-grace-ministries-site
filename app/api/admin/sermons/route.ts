import { z } from 'zod'
import { adminGuard } from '@/lib/admin/guard'
import { recordAudit } from '@/lib/audit'
import { clearManualVideoIdsCache } from '@/lib/youtube'
import { readManualVideoIds, writeManualVideoIds } from '@/lib/admin/youtube-settings'

/**
 * Save the manual YouTube override list (`settings/youtube`). POST
 * { manualVideoIds: string[] }, admin-only, audited.
 */
const schema = z.object({
  manualVideoIds: z
    .array(z.string().trim().min(1).max(40))
    .max(50)
    .transform((ids) => [...new Set(ids)]),
})

export async function POST(request: Request) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid video ID list.' }, { status: 400 })
  }

  try {
    const before = await readManualVideoIds()
    await writeManualVideoIds(parsed.data.manualVideoIds)
    clearManualVideoIdsCache()

    await recordAudit({
      actorUid: guard.user.uid,
      actorEmail: guard.user.email,
      action: 'update',
      collection: 'settings',
      docId: 'youtube',
      before: { manualVideoIds: before },
      after: { manualVideoIds: parsed.data.manualVideoIds },
    })

    return Response.json({ ok: true, count: parsed.data.manualVideoIds.length })
  } catch (error) {
    console.error('[admin/sermons] save failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not save the list. Please try again.' }, { status: 500 })
  }
}
