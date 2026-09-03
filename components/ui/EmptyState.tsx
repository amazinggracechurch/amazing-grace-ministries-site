import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type EmptyStateProps = {
  icon?: ReactNode
  title: string
  body?: string
  /** Typically a Button — the way out of the empty state. */
  action?: ReactNode
  className?: string
}

/** Shown wherever a list or view has nothing to render. */
export default function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border-strong bg-surface px-6 py-16 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-accent-subtle text-accent">
          {icon}
        </div>
      )}
      <h3 className="font-display text-heading tracking-display text-text-primary">{title}</h3>
      {body && <p className="max-w-md text-body-sm text-text-secondary">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
