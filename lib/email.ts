import 'server-only'
import { env, has } from '@/lib/env'

/**
 * Transactional email via Resend. When RESEND_API_KEY is not configured
 * the send is skipped with a warning — callers must treat email as
 * best-effort and never depend on it for correctness (the donation is
 * recorded, the RSVP exists, whether or not the email lands).
 */

export type EmailMessage = {
  to: string
  subject: string
  html: string
  replyTo?: string
  attachments?: { filename: string; content: string }[] // base64 content
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  if (!has.resend()) {
    console.warn('[email] RESEND_API_KEY not configured — skipping send', {
      to: message.to,
      subject: message.subject,
    })
    return false
  }
  const { RESEND_API_KEY, EMAIL_FROM } = env.resend()
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
        reply_to: message.replyTo,
        attachments: message.attachments,
      }),
    })
    if (!response.ok) {
      console.error('[email] resend responded', response.status)
      return false
    }
    return true
  } catch (error) {
    console.error('[email] send failed', error instanceof Error ? error.message : 'unknown')
    return false
  }
}
