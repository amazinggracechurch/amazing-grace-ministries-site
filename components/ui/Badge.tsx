import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-sunken text-text-secondary',
  accent: 'bg-accent-subtle text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
}

type BadgeProps = {
  variant?: BadgeVariant
  className?: string
  children: ReactNode
}

export default function Badge({ variant = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 text-caption font-semibold',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
