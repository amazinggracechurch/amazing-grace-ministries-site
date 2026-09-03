import type { ReactNode } from 'react'

type ScrollRailProps = {
  children: ReactNode
  /** Accessible label for the rail region. */
  label: string
  className?: string
}

/**
 * Horizontal snap-scroll rail. Native overflow scrolling keeps it
 * keyboard- and touch-accessible with no JS.
 */
export default function ScrollRail({ children, label, className = '' }: ScrollRailProps) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`-mx-6 px-6 overflow-x-auto snap-x snap-mandatory [scrollbar-width:thin] ${className}`}
    >
      <div className="flex gap-6 w-max pb-2 [&>*]:snap-start [&>*]:shrink-0">
        {children}
      </div>
    </div>
  )
}
