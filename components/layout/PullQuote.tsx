import type { ReactNode } from 'react'

type PullQuoteProps = {
  children: ReactNode
  /** Attribution line — name, or book/chapter/verse for scripture. */
  cite?: string
  className?: string
}

/**
 * Editorial pull-quote band. Italic Cormorant is the site's signature
 * gesture — this is where it lives. Keep quotes short.
 */
export default function PullQuote({ children, cite, className = '' }: PullQuoteProps) {
  return (
    <figure className={`max-w-3xl mx-auto text-center ${className}`}>
      <blockquote className="font-display italic font-medium text-display-md tracking-display leading-[1.15] text-text-primary">
        {children}
      </blockquote>
      {cite && (
        <figcaption className="mt-6 eyebrow text-text-muted">{cite}</figcaption>
      )}
    </figure>
  )
}
