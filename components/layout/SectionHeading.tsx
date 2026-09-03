import type { ReactNode } from 'react'

type SectionHeadingProps = {
  eyebrow?: string
  title: ReactNode
  lede?: ReactNode
  /** Left is the default. Center is a moment of rest — use sparingly. */
  align?: 'left' | 'center'
  className?: string
}

export default function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const centered = align === 'center'
  return (
    <div className={`${centered ? 'text-center mx-auto' : ''} max-w-2xl ${className}`}>
      {eyebrow && (
        <p className="eyebrow text-accent mb-4">{eyebrow}</p>
      )}
      <h2 className="font-display font-medium text-display-md tracking-display text-text-primary">
        {title}
      </h2>
      {lede && (
        <p className="mt-5 text-subheading text-text-secondary">{lede}</p>
      )}
    </div>
  )
}
