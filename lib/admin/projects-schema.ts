import { z } from 'zod'

/**
 * Shared validation for admin project mutations. The client converts
 * dollars to integer cents before posting; the schema double-checks.
 */
export const PROJECT_STATUSES = ['draft', 'active', 'funded', 'completed', 'archived'] as const

export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required.')
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase words separated by hyphens.')

export const nullableUrl = z
  .union([z.literal(''), z.url('Must be a full URL (https://…).')])
  .transform((value) => (value === '' ? null : value))

const nullableDate = z
  .union([
    z.literal(''),
    z
      .string()
      .trim()
      .regex(
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/,
        'Use a valid date.'
      ),
  ])
  .transform((value) => (value === '' ? null : value))

export const projectInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  slug: slugSchema,
  description: z.string().trim().max(20000),
  coverImage: nullableUrl,
  goalAmountCents: z.number().int().min(0).max(1_000_000_000),
  startDate: nullableDate,
  endDate: nullableDate,
  status: z.enum(PROJECT_STATUSES),
  featured: z.boolean(),
  sortOrder: z.number().int().min(0).max(100000),
})

export type ProjectInput = z.infer<typeof projectInputSchema>
