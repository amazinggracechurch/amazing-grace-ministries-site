import { z } from 'zod'
import { adminGuard } from '@/lib/admin/guard'
import { recordAudit } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { adminDb } from '@/lib/firebase/admin'
import { INTEREST_GROUPS } from '@/lib/member-groups'

/**
 * Email all members of an interest group (or every member with 'all').
 * POST {interest, subject, body}, admin-only, audited. Members who opted
 * out of email updates are skipped. Recipients are BCC-style individual
 * sends through Resend in batches of 50 so a single bad address can't
 * sink the batch.
 */

const GROUPS: readonly string[] = [...INTEREST_GROUPS, 'all']

const emailSchema = z.object({
  interest: z.string().min(1).max(60),
  subject: z.string().trim().min(1, 'Subject is required.').max(150),
  body: z.string().trim().min(1, 'Body is required.').max(5000),
})

const BATCH_SIZE = 50

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Plain-text body → simple HTML paragraphs/line breaks. */
function bodyToHtml(body: string): string {
  return escapeHtml(body).replace(/\r?\n/g, '<br />')
}

export async function POST(request: Request) {
  const guard = await adminGuard()
  if (!guard.ok) return guard.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = emailSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid email details.' },
      { status: 400 }
    )
  }

  const { interest, subject } = parsed.data
  if (!GROUPS.includes(interest)) {
    return Response.json({ error: 'Unknown interest group.' }, { status: 400 })
  }

  // Repo convention: plain collection read with in-memory filtering,
  // no composite indexes (same as listMembers).
  const snapshot = await adminDb().collection('users').get()
  const recipients = [...new Set(
    snapshot.docs
      .map((doc) => doc.data())
      .filter((data) =>
        interest === 'all' ||
        (Array.isArray(data.interests) && data.interests.includes(interest))
      )
      // Opt-out semantics: emailUpdates defaults to true when absent.
      .filter((data) => data.communicationPrefs?.emailUpdates !== false)
      .map((data) =>
        typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
      )
      .filter(Boolean)
  )]

  if (recipients.length === 0) {
    return Response.json({ error: 'No members to email for this group.' }, { status: 400 })
  }

  const html = bodyToHtml(parsed.data.body)
  let sent = 0
  let failed = 0
  for (let index = 0; index < recipients.length; index += BATCH_SIZE) {
    const batch = recipients.slice(index, index + BATCH_SIZE)
    const results = await Promise.all(
      batch.map((to) => sendEmail({ to, subject, html }))
    )
    for (const ok of results) {
      if (ok) sent += 1
      else failed += 1
    }
  }

  await recordAudit({
    actorUid: guard.user.uid,
    actorEmail: guard.user.email,
    action: 'email_interest_group',
    collection: 'users',
    docId: interest,
    after: {
      subject,
      recipients: recipients.length,
      sent,
      failed,
    },
  })

  return Response.json({ ok: true, recipients: recipients.length, sent, failed })
}
