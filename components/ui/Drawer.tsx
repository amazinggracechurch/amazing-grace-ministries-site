'use client'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { useOverlayA11y } from './useOverlayA11y'

export type DrawerProps = {
  open: boolean
  onClose: () => void
  /** Visible heading; also labels the drawer for assistive tech. */
  title: string
  children: ReactNode
  className?: string
}

const subscribe = () => () => {}

/**
 * Right-side drawer with the same a11y contract as Dialog. Slides in via
 * a transform-only WAAPI animation (250ms); skipped under reduced motion.
 */
export default function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  useOverlayA11y(panelRef, { open, onClose })

  // Slide in via WAAPI — transform-only, 250ms, no state churn per frame.
  useEffect(() => {
    if (!open) return
    const node = panelRef.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const animation = node.animate(
      [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }],
      { duration: 250, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    )
    return () => animation.cancel()
  }, [open])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/45"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border-subtle bg-surface-raised shadow-lifted',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle p-6">
          <h2
            id={titleId}
            className="font-display text-heading tracking-display text-text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="-m-1 p-1 text-text-muted transition-colors duration-200 hover:bg-surface-sunken hover:text-text-primary"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}
