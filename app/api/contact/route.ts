import { z } from 'zod'
import { departmentNames } from '@/components/contact/departments'

/**
 * Contact form backend. POST only.
 *
 * - Validates with zod (schema mirrors the client-side validation).
 * - Honeypot: a filled `website` field gets a fake 200 and nothing is sent.
 * - Naive in-memory per-IP rate limit: 5 messages per hour.
 * - Delivery: plain fetch to the Resend API. Secrets stay server-side
 *   (RESEND_API_KEY / EMAIL_FROM / CONTACT_INBOX, see .env.example).
 * - If email isn't configured, responds 503 { error: 'email_not_configured' }
 *   so the client can show designed alternatives instead of a bare failure.
 */

const contactSchema = z.object({
  firstName: z.string().trim().min(1, 'Please enter your first name.').max(100),
  lastName: z.string().trim().min(1, 'Please enter your last name.').max(100),
  email: z.email('Please enter a valid email address.').max(320),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  department: z.enum(departmentNames, 'Please select a department.'),
  subject: z.string().trim().min(1, 'Please enter a subject.').max(200),
  message: z.string().trim().min(1, 'Please enter your message.').max(5000),
  website: z.string().max(200).optional(),
})

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

type RateEntry = { count: number; resetAt: number }

// Per server instance — intentionally naive; good enough to blunt drive-by abuse.
const globalStore = globalThis as typeof globalThis & {
  __contactRateLimit?: Map<string, RateEntry>
}
const hits = (globalStore.__contactRateLimit ??= new Map<string, RateEntry>())

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT
}

function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }

  // Honeypot — pretend success, send nothing.
  if (
    typeof body === 'object' &&
    body !== null &&
    'website' in body &&
    typeof (body as Record<string, unknown>).website === 'string' &&
    ((body as Record<string, unknown>).website as string).trim() !== ''
  ) {
    return Response.json({ ok: true })
  }

  if (isRateLimited(clientIp(request))) {
    return Response.json({ error: 'rate_limited' }, { status: 429 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'validation', issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    )
  }

  const { firstName, lastName, email, phone, department, subject, message } = parsed.data

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  const inbox = process.env.CONTACT_INBOX
  if (!apiKey || !from || !inbox) {
    return Response.json({ error: 'email_not_configured' }, { status: 503 })
  }

  const text = [
    `New message from the website contact form`,
    ``,
    `Name: ${firstName} ${lastName}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    `Department: ${department}`,
    `Subject: ${subject}`,
    ``,
    `Message:`,
    message,
  ]
    .filter((line) => line !== null)
    .join('\n')

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [inbox],
        reply_to: email,
        subject: `[Contact] ${department} — ${subject}`,
        text,
      }),
    })

    if (!res.ok) {
      return Response.json({ error: 'send_failed' }, { status: 502 })
    }
  } catch {
    return Response.json({ error: 'send_failed' }, { status: 502 })
  }

  return Response.json({ ok: true })
}
