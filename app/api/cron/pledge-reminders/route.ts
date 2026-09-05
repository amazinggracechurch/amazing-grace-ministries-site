import { env, has } from '@/lib/env'
import { sendPledgeReminders } from '@/lib/pledge-reminders'

/**
 * Vercel Cron entry point for weekly pledge reminder emails (see
 * vercel.json). Auth follows the Vercel convention: the platform sends
 * `Authorization: Bearer $CRON_SECRET`; without a configured secret the
 * route refuses to run at all (503) so a misconfigured deploy can never
 * send mail.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!has.cron()) {
    return Response.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${env.cron().CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const summary = await sendPledgeReminders()
  return Response.json(summary)
}
