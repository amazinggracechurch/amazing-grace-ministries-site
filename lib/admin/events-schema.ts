import { z } from 'zod'
import { nullableUrl, slugSchema } from '@/lib/admin/projects-schema'

/**
 * Shared validation for admin event mutations. startAt/endAt arrive as
 * church-local "YYYY-MM-DDTHH:mm" strings and are converted to ISO
 * instants by the route (see lib/admin/chicago-time.ts). Timezone is
 * fixed to America/Chicago per spec.
 */

const localDateTime = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Use the date-time picker format.')

const nullableLocalDateTime = z
  .union([z.literal(''), localDateTime])
  .transform((value) => (value === '' ? null : value))

const nullableInt = z
  .union([z.literal(''), z.number().int().min(0).max(1_000_000_000)])
  .transform((value) => (value === '' ? null : value))

export const eventInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  slug: slugSchema,
  description: z.string().trim().max(20000),
  flyerImage: nullableUrl,
  startAt: localDateTime,
  endAt: nullableLocalDateTime,
  locationName: z.string().trim().max(200),
  locationAddress: z.string().trim().max(300),
  capacity: nullableInt,
  priceCents: nullableInt,
  status: z.enum(['draft', 'published', 'cancelled']),
  featured: z.boolean(),
})

export type EventInput = z.infer<typeof eventInputSchema>
