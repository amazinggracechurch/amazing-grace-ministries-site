import { z } from 'zod'

/**
 * Admin product input (spec §8). Integer cents everywhere; variant priceCents
 * is an optional override of the product price. Stock is a non-negative
 * integer — the church holds inventory physically.
 */
export const productVariantSchema = z.object({
  id: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1, 'Each variant needs a name.').max(80),
  sku: z.string().trim().max(60).default(''),
  stock: z.number().int().min(0).max(100000),
  priceCents: z.number().int().min(1).max(10000000).optional(),
})

export const productInputSchema = z.object({
  title: z.string().trim().min(1, 'Please enter a title.').max(160),
  slug: z
    .string()
    .trim()
    .min(1, 'Please enter a slug.')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase words separated by hyphens.'),
  description: z.string().trim().max(5000).default(''),
  images: z.array(z.string().trim().min(1).max(2000)).max(8).default([]),
  priceCents: z.number().int().min(1, 'Price must be at least $0.01.').max(10000000),
  category: z.string().trim().min(1, 'Please enter a category.').max(80),
  variants: z.array(productVariantSchema).min(1, 'Add at least one variant.').max(50),
  fulfillmentMethod: z.literal('pickup'),
  status: z.enum(['active', 'draft', 'archived']),
  featured: z.boolean(),
})

export type ProductInput = z.infer<typeof productInputSchema>
