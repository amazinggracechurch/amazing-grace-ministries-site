import { z } from 'zod'
import { getSessionUser } from '@/lib/auth/session'
import { getProjectBySlug } from '@/lib/projects'
import { createPledge, PledgeError } from '@/lib/pledges'

/**
 * Creates a pledge against an active project. POST only.
 *
 * - Session required (signed-in members only) — 401 otherwise.
 * - zod-validated body; the client sends a project SLUG (what the page
 *   knows), never a project id; the id is resolved server-side.
 * - The pledge write and the project's pledgedAmountCents bump happen in a
 *   single Firestore transaction (see lib/pledges.ts).
 */

const pledgeSchema = z.object({
  projectSlug: z.string().trim().min(1).max(200),
  amountCents: z
    .number()
    .int()
    .min(100, 'The minimum pledge is $1.')
    .max(100_000_000, 'Please contact the office for a pledge this large.'),
  frequency: z.enum(['one-time', 'monthly', 'quarterly'], 'Please choose a valid frequency.'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid end date.')
    .optional(),
})

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return errorResponse('Please sign in to make a pledge.', 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body.', 400)
  }

  const parsed = pledgeSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid pledge details.', 400)
  }

  const { projectSlug, amountCents, frequency, endDate } = parsed.data

  try {
    const project = await getProjectBySlug(projectSlug)
    if (!project) {
      return errorResponse('This project could not be found.', 404)
    }

    const pledge = await createPledge({
      userId: user.uid,
      projectId: project.id,
      amountCents,
      frequency,
      // Store as an ISO instant pinned to midnight UTC of the chosen date.
      endDate: endDate ? new Date(`${endDate}T00:00:00.000Z`).toISOString() : null,
    })
    return Response.json({ ok: true, pledge })
  } catch (error) {
    if (error instanceof PledgeError) {
      const status = error.code === 'project_not_found' ? 404 : 409
      return errorResponse(error.message, status)
    }
    console.error('[pledges] create failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return errorResponse('Something went wrong saving your pledge. Please try again.', 500)
  }
}
