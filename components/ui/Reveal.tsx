'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  /** Stagger step 0–4 (70ms each) applied to the entrance transition. */
  delay?: 0 | 1 | 2 | 3 | 4
  className?: string
}

/**
 * Fade + rise entrance, triggered once when ~15% visible.
 * Styles live in globals.css (.reveal / .is-visible); the base layer
 * collapses motion under prefers-reduced-motion, so no JS special-casing.
 */
export default function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible])

  const classes = [
    'reveal',
    visible ? 'is-visible' : '',
    delay > 0 ? `reveal-delay-${delay}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={ref} className={classes}>
      {children}
    </div>
  )
}
