import type { ReactNode } from 'react'

export type AdminHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
}

/** Consistent header row for /admin sections. */
export default function AdminHeader({ title, description, action }: AdminHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-6">
      <div>
        <p className="eyebrow text-text-muted">Admin</p>
        <h1 className="mt-2 font-display text-display-md font-light uppercase tracking-display text-text-primary">
          {title}
          <span className="text-accent">.</span>
        </h1>
        {description && <p className="mt-3 max-w-2xl text-body-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  )
}
