import { z } from 'zod'

/**
 * Portable body format for posts (spec §9). The body is stored in
 * Firestore as an array of typed blocks — never raw HTML. The schema
 * below is the sanitizer: anything that does not parse is rejected
 * before it can reach a component, so no user-authored string ever
 * touches dangerouslySetInnerHTML.
 *
 * Safe to import from client and server code (types + validation only;
 * the JSX renderer lives in lib/posts/render.tsx).
 */

export const paragraphBlockSchema = z.object({
  type: z.literal('paragraph'),
  text: z.string().min(1),
})

/** h2/h3 only — the page owns the single h1, so levels can't skip. */
export const headingBlockSchema = z.object({
  type: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3)]),
  text: z.string().min(1),
})

/** The site's signature gesture: italic Cormorant scripture + reference. */
export const scriptureBlockSchema = z.object({
  type: z.literal('scripture'),
  text: z.string().min(1),
  reference: z.string().min(1),
})

export const pullquoteBlockSchema = z.object({
  type: z.literal('pullquote'),
  text: z.string().min(1),
  cite: z.string().optional(),
})

export const imageBlockSchema = z.object({
  type: z.literal('image'),
  src: z.string().min(1),
  alt: z.string(),
  caption: z.string().optional(),
})

export const listBlockSchema = z.object({
  type: z.literal('list'),
  style: z.union([z.literal('bullet'), z.literal('number')]),
  items: z.array(z.string().min(1)).min(1),
})

export const blockSchema = z.discriminatedUnion('type', [
  paragraphBlockSchema,
  headingBlockSchema,
  scriptureBlockSchema,
  pullquoteBlockSchema,
  imageBlockSchema,
  listBlockSchema,
])

export const blocksSchema = z.array(blockSchema)

export type ParagraphBlock = z.infer<typeof paragraphBlockSchema>
export type HeadingBlock = z.infer<typeof headingBlockSchema>
export type ScriptureBlock = z.infer<typeof scriptureBlockSchema>
export type PullquoteBlock = z.infer<typeof pullquoteBlockSchema>
export type ImageBlock = z.infer<typeof imageBlockSchema>
export type ListBlock = z.infer<typeof listBlockSchema>
export type Block = z.infer<typeof blockSchema>

/**
 * Validate an unknown Firestore payload into typed blocks. Returns null
 * when the payload is not a valid block array — callers decide whether
 * to skip the post or render it without a body.
 */
export function parseBlocks(value: unknown): Block[] | null {
  const result = blocksSchema.safeParse(value)
  return result.success ? result.data : null
}
