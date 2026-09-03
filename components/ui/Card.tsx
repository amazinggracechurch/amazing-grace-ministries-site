import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type CardProps = {
  children: ReactNode
  /** Media slot rendered flush at the top of the card (image, video, map). */
  media?: ReactNode
  /** Subtle 2px lift with a deeper shadow on hover — for linked cards. */
  hoverable?: boolean
  /** Inner padding around children. Defaults to true. */
  padded?: boolean
  className?: string
}

export default function Card({
  children,
  media,
  hoverable = false,
  padded = true,
  className,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border-subtle bg-surface-raised shadow-card',
        hoverable && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted',
        className
      )}
    >
      {media && <div className="overflow-hidden rounded-t-card">{media}</div>}
      <div className={cn(padded && 'p-6')}>{children}</div>
    </div>
  )
}
