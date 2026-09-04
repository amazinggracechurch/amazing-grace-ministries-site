import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

export type PaginationProps = {
  /** Current page, 1-based. */
  page: number
  totalPages: number
  /** Button mode: called when a page is chosen. */
  onPageChange?: (page: number) => void
  /** Link mode: builds the href for a page. Takes precedence over onPageChange. */
  hrefFor?: (page: number) => string
  className?: string
}

type PageItem = number | 'gap'

/** 1 … window around the current page … total, collapsing to a plain list when short. */
function pageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const windowStart = Math.max(2, Math.min(page - 1, totalPages - 4))
  const windowEnd = Math.min(totalPages - 1, windowStart + 2)
  const items: PageItem[] = [1]
  if (windowStart > 2) items.push('gap')
  for (let n = windowStart; n <= windowEnd; n += 1) items.push(n)
  if (windowEnd < totalPages - 1) items.push('gap')
  items.push(totalPages)
  return items
}

const controlClasses =
  'flex size-9 items-center justify-center text-body-sm font-semibold transition-colors duration-200'

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  hrefFor,
  className,
}: PaginationProps) {
  const items = pageItems(page, totalPages)

  const renderControl = (
    target: number,
    label: string,
    disabled: boolean,
    current: boolean,
    content: React.ReactNode
  ) => {
    const classes = cn(
      controlClasses,
      current
        ? 'bg-accent text-on-accent'
        : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
      disabled && 'pointer-events-none opacity-40'
    )
    if (hrefFor) {
      return (
        <Link
          href={hrefFor(target)}
          aria-label={label}
          aria-current={current ? 'page' : undefined}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          className={classes}
        >
          {content}
        </Link>
      )
    }
    return (
      <button
        type="button"
        onClick={() => onPageChange?.(target)}
        aria-label={label}
        aria-current={current ? 'page' : undefined}
        disabled={disabled}
        className={classes}
      >
        {content}
      </button>
    )
  }

  return (
    <nav aria-label="Pagination" className={className}>
      <ul className="flex items-center gap-1">
        <li>
          {renderControl(
            page - 1,
            'Previous page',
            page <= 1,
            false,
            <ChevronLeft className="size-4" aria-hidden="true" />
          )}
        </li>
        {items.map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-text-muted">
              …
            </li>
          ) : (
            <li key={item}>{renderControl(item, `Page ${item}`, false, item === page, item)}</li>
          )
        )}
        <li>
          {renderControl(
            page + 1,
            'Next page',
            page >= totalPages,
            false,
            <ChevronRight className="size-4" aria-hidden="true" />
          )}
        </li>
      </ul>
    </nav>
  )
}
