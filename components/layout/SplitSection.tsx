import type { ReactNode } from 'react'

type SplitSectionProps = {
  /** The wider column (7 of 12). */
  main: ReactNode
  /** The narrower column (5 of 12). */
  aside: ReactNode
  /** Place `main` on the right instead of the left. */
  flip?: boolean
  className?: string
}

/**
 * Asymmetric two-column layout (~7/5). Asymmetry is the point —
 * do not use for content that wants equal columns.
 */
export default function SplitSection({ main, aside, flip = false, className = '' }: SplitSectionProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center ${className}`}>
      <div className={`lg:col-span-7 ${flip ? 'lg:order-2' : ''}`}>{main}</div>
      <div className={`lg:col-span-5 ${flip ? 'lg:order-1' : ''}`}>{aside}</div>
    </div>
  )
}
