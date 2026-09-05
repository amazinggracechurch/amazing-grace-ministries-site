import { adminGuard } from '@/lib/admin/guard'
import { recordAudit } from '@/lib/audit'
import {
  readSiteSettings,
  siteSettingsSchema,
  writeSiteSettings,
  SITE_SETTINGS_DOC,
} from '@/lib/admin/site-settings'

/**
 * Save the `settings/site` document. POST, admin-only, audited with
 * before/after. (Public pages still read lib/site.ts constants — the
 * read-side swap is a later task.)
 */
export async function POST(request: Request) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = siteSettingsSchema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const where = issue && issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
    return Response.json(
      { error: `${where}${issue?.message ?? 'Invalid settings.'}` },
      { status: 400 }
    )
  }

  try {
    const before = await readSiteSettings()
    await writeSiteSettings(parsed.data)

    await recordAudit({
      actorUid: guard.user.uid,
      actorEmail: guard.user.email,
      action: 'update',
      collection: 'settings',
      docId: SITE_SETTINGS_DOC.split('/')[1]!,
      before,
      after: parsed.data,
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[admin/settings] save failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return Response.json({ error: 'Could not save settings. Please try again.' }, { status: 500 })
  }
}
