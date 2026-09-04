'use client'
import { X } from 'lucide-react'
import { useId, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { useOverlayA11y } from './useOverlayA11y'

export type DialogProps = {
  open: boolean
  onClose: () => void
  /** Visible heading; also labels the dialog for assistive tech. */
  title: string
  children: ReactNode
  className?: string
}

const subscribe = () => () => {}

/**
 * Modal dialog: portaled to body, focus-trapped, Esc and click-outside
 * close, scroll locked while open, focus restored to the trigger on close.
 */
export default function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  // Portals are client-only; skip SSR without a mounted-state effect.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  useOverlayA11y(panelRef, { open, onClose })

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          'relative w-full max-w-lg rounded-card border border-border-subtle bg-surface-raised p-6 shadow-lifted',
          className
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="font-display text-heading tracking-display text-text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-m-1 p-1 text-text-muted transition-colors duration-200 hover:bg-surface-sunken hover:text-text-primary"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
