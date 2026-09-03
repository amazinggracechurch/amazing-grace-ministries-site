import type { ReactNode } from 'react'

type SectionProps = {
  children: ReactNode
  /** Vertical rhythm. Vary it across a page — never the same everywhere. */
  rhythm?: 'dense' | 'normal' | 'loose'
  /** Quiet band (sunken surface) for alternating page texture. */
  sunken?: boolean
  className?: string
  id?: string
}

const rhythmClass = {
  dense: 'py-16 md:py-20',
  normal: 'py-20 md:py-24',
  loose: 'py-24 md:py-36',
} as const

export default function Section({
  children,
  rhythm = 'normal',
  sunken = false,
  className = '',
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`${rhythmClass[rhythm]} ${sunken ? 'bg-surface-sunken' : ''} ${className}`}
    >
      <div className="max-w-7xl mx-auto px-6">{children}</div>
    </section>
  )
}
