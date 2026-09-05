import Image from 'next/image'
import type { ReactNode } from 'react'
import PullQuote from '@/components/layout/PullQuote'
import type { Block } from '@/lib/posts/blocks'

/**
 * Server renderer for portable post bodies. Blocks arrive already
 * validated by lib/posts/blocks.ts — this module only maps them to
 * styled JSX. No raw HTML exists anywhere in the pipeline, so nothing
 * here ever reaches dangerouslySetInnerHTML.
 */

type RenderOptions = {
  /** Style the first paragraph with a Cormorant drop cap. */
  dropCapFirstParagraph?: boolean
}

function renderBlock(block: Block, index: number, dropCap: boolean): ReactNode {
  switch (block.type) {
    case 'paragraph':
      return (
        <p
          key={index}
          className={
            dropCap
              ? 'text-body leading-relaxed text-text-secondary first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:font-medium first-letter:text-display-lg first-letter:leading-[0.85] first-letter:text-accent'
              : 'text-body leading-relaxed text-text-secondary'
          }
        >
          {block.text}
        </p>
      )
    case 'heading': {
      if (block.level === 2) {
        return (
          <h2
            key={index}
            className="font-display font-medium text-heading tracking-display text-text-primary"
          >
            {block.text}
          </h2>
        )
      }
      return (
        <h3
          key={index}
          className="font-display font-medium text-subheading tracking-display text-text-primary"
        >
          {block.text}
        </h3>
      )
    }
    case 'scripture':
      return (
        <figure key={index} className="border-l-2 border-accent pl-6 py-1">
          <blockquote className="font-display italic font-medium text-heading tracking-display leading-snug text-text-primary">
            {block.text}
          </blockquote>
          <figcaption className="mt-3 eyebrow text-text-muted">{block.reference}</figcaption>
        </figure>
      )
    case 'pullquote':
      return (
        <PullQuote key={index} cite={block.cite}>
          {block.text}
        </PullQuote>
      )
    case 'image':
      return (
        <figure key={index}>
          <Image
            src={block.src}
            alt={block.alt}
            width={1200}
            height={675}
            className="h-auto w-full"
          />
          {block.caption && (
            <figcaption className="mt-3 text-caption text-text-muted">{block.caption}</figcaption>
          )}
        </figure>
      )
    case 'list': {
      const items = block.items.map((item, i) => (
        <li key={i} className="pl-1">
          {item}
        </li>
      ))
      const classes = 'text-body leading-relaxed text-text-secondary space-y-2 pl-6 marker:text-accent'
      return block.style === 'number' ? (
        <ol key={index} className={`list-decimal ${classes}`}>
          {items}
        </ol>
      ) : (
        <ul key={index} className={`list-disc ${classes}`}>
          {items}
        </ul>
      )
    }
  }
}

/**
 * Render a validated block array at a readable article measure
 * (max-w-[65ch]) with editorial vertical rhythm.
 */
export function renderBlocks(blocks: Block[], options: RenderOptions = {}): ReactNode {
  let dropCapUsed = false
  const rendered = blocks.map((block, index) => {
    const dropCap =
      Boolean(options.dropCapFirstParagraph) && !dropCapUsed && block.type === 'paragraph'
    if (dropCap) dropCapUsed = true
    return renderBlock(block, index, dropCap)
  })
  return <div className="max-w-[65ch] space-y-8">{rendered}</div>
}
