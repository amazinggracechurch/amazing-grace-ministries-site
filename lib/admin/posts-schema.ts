import { z } from 'zod'
import { blocksSchema } from '@/lib/posts/blocks'
import { nullableUrl, slugSchema } from '@/lib/admin/projects-schema'

/**
 * Whole-payload validation for the admin post editor. The body is checked
 * against the same portable block schema the public renderer trusts, so an
 * invalid block can never be saved.
 */
export const postInputSchema = z.object({
  id: z.string().trim().min(1).max(200).optional(),
  type: z.enum(['sermon', 'announcement']),
  title: z.string().trim().min(1, 'Title is required.').max(200),
  slug: slugSchema,
  excerpt: z.string().trim().max(500),
  body: blocksSchema,
  coverImage: nullableUrl,
  authorName: z.string().trim().min(1, 'Author name is required.').max(120),
  speaker: z.string().trim().max(120).transform((v) => v || undefined),
  scriptureRef: z.string().trim().max(120).transform((v) => v || undefined),
  series: z.string().trim().max(120).transform((v) => v || undefined),
  tags: z.array(z.string().trim().min(1).max(60)).max(20),
  status: z.enum(['draft', 'published', 'scheduled']),
  /** Church-local "YYYY-MM-DDTHH:mm" — converted to an ISO instant by the route. */
  publishAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Use the date-time picker format.'),
  seoDescription: z.string().trim().max(300).transform((v) => v || undefined),
})

export type PostInput = z.infer<typeof postInputSchema>
