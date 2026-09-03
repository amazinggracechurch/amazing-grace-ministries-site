import type { ReactNode } from 'react'
import Image from 'next/image'

type FullBleedProps = {
  src: string
  alt: string
  children?: ReactNode
  /** Where the overlaid content sits. */
  align?: 'left' | 'center'
  /** Minimum height of the band. */
  height?: 'band' | 'tall' | 'screen'
  priority?: boolean
  className?: string
}

const heightClass = {
  band: 'min-h-[420px]',
  tall: 'min-h-[70vh]',
  screen: 'min-h-svh',
} as const

/**
 * Edge-to-edge photography with type overlaid. The image does the work;
 * the overlay only guarantees legibility.
 */
export default function FullBleed({
  src,
  alt,
  children,
  align = 'left',
  height = 'tall',
  priority = false,
  className = '',
}: FullBleedProps) {
  return (
    <div className={`relative isolate overflow-hidden ${heightClass[height]} flex items-end ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover -z-10"
      />
      {/* Legibility gradient, anchored to the bottom where content sits */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
      />
      <div
        className={`w-full max-w-7xl mx-auto px-6 pb-16 pt-32 text-white ${
          align === 'center' ? 'text-center' : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}
