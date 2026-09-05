import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { sendEmail } from '@/lib/email'
import { env } from '@/lib/env'
import { site } from '@/lib/site'
import { formatUsd } from '@/lib/money'
import { splitDisplayName } from '@/lib/names'
import { getMemberProfile } from '@/lib/account/member'
import { getProjectById } from '@/lib/projects'
import { listActivePledges, pledgeRemainingCents, type Pledge } from '@/lib/pledges'

/**
 * Weekly pledge reminder emails, driven by the Vercel Cron route at
 * /api/cron/pledge-reminders. Best-effort throughout: a missing profile,
 * a Resend outage, or a failed write is logged and counted, never thrown —
 * one bad pledge must not stop the rest of the batch.
 */

/** Minimum gap between reminders for one pledge, in milliseconds (6 days). */
const REMINDER_INTERVAL_MS = 6 * 24 * 60 * 60 * 1000

/**
 * Pure due check (unit-tested): an active pledge with money still
 * outstanding, not past its end date, and not reminded within the last
 * 6 days. The 6-day gap makes the weekly cron's exact cadence forgiving.
 */
export function isReminderDue(pledge: Pledge, now: Date): boolean {
  if (pledge.status !== 'active') return false
  if (pledgeRemainingCents(pledge) <= 0) return false
  if (pledge.endDate && now.getTime() > new Date(pledge.endDate).getTime()) return false
  if (pledge.lastReminderAt) {
    const last = new Date(pledge.lastReminderAt).getTime()
    if (now.getTime() - last < REMINDER_INTERVAL_MS) return false
  }
  return true
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function reminderEmailHtml(args: {
  firstName: string
  projectTitle: string
  pledge: Pledge
}): string {
  const { firstName, projectTitle, pledge } = args
  const remaining = pledgeRemainingCents(pledge)
  const giveUrl = `${env.siteUrl()}/give`
  const prefsUrl = `${env.siteUrl()}/account/profile`

  return `
    <div style="font-family: Georgia, serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
      <p style="text-transform: uppercase; letter-spacing: 0.18em; font-size: 11px; color: #8a6d3b; margin: 0 0 8px;">
        Amazing Grace Ministries MN
      </p>
      <h1 style="font-size: 28px; font-weight: 500; margin: 0 0 16px;">
        A gentle pledge reminder
      </h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Hi ${escapeHtml(firstName)}, thank you for pledging toward
        <strong>${escapeHtml(projectTitle)}</strong>. Here is where your
        pledge stands today:
      </p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 4px;"><strong>Pledged:</strong> ${formatUsd(pledge.amountCents)}</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 4px;"><strong>Fulfilled so far:</strong> ${formatUsd(pledge.fulfilledAmountCents)}</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;"><strong>Remaining:</strong> ${formatUsd(remaining)}</p>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        You can give toward your pledge any time here:<br />
        <a href="${giveUrl}" style="color: #8a6d3b;">${giveUrl}</a>
      </p>
      <p style="font-size: 13px; color: #666; line-height: 1.6; margin: 0 0 16px;">
        Rather not receive these reminders? You can turn them off in your
        <a href="${prefsUrl}" style="color: #8a6d3b;">communication preferences</a>.
      </p>
      <p style="font-size: 13px; color: #666; margin: 0;">
        ${site.name} · ${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}
      </p>
    </div>
  `.trim()
}

/**
 * Sends one reminder per due pledge. Returns batch counts; per-pledge
 * failures are logged and counted, never thrown.
 */
export async function sendPledgeReminders(): Promise<{
  considered: number
  sent: number
  skipped: number
  failed: number
}> {
  const summary = { considered: 0, sent: 0, skipped: 0, failed: 0 }
  const pledges = await listActivePledges()
  const now = new Date()

  for (const pledge of pledges) {
    summary.considered += 1
    if (!isReminderDue(pledge, now)) {
      summary.skipped += 1
      continue
    }

    try {
      const profile = await getMemberProfile(pledge.userId)
      if (!profile?.email || profile.communicationPrefs.pledgeReminders === false) {
        summary.skipped += 1
        continue
      }
      const project = await getProjectById(pledge.projectId)
      const projectTitle = project?.title ?? 'your pledge'
      const firstName = splitDisplayName(profile.displayName).firstName ?? 'friend'

      const ok = await sendEmail({
        to: profile.email,
        subject: `Pledge reminder: ${projectTitle}`,
        html: reminderEmailHtml({ firstName, projectTitle, pledge }),
      })
      if (!ok) {
        summary.failed += 1
        continue
      }
      await adminDb()
        .collection('pledges')
        .doc(pledge.id)
        .set({ lastReminderAt: now.toISOString() }, { merge: true })
      summary.sent += 1
    } catch (error) {
      console.error(
        `[pledge-reminders] failed for pledge ${pledge.id}`,
        error instanceof Error ? error.message : 'unknown'
      )
      summary.failed += 1
    }
  }

  return summary
}
