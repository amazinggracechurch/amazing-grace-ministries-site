'use client'
import Image from 'next/image'
import { useState, type ReactNode } from 'react'
import { Play } from 'lucide-react'
import type { Sermon } from '@/lib/youtube'

type SermonPlayerProps = {
  sermon: Sermon
  /** next/image sizes hint for the poster. */
  sizes: string
  /** Optional badge pinned top-left (e.g. "Latest Message"). */
  badge?: ReactNode
  /** Optional caption pinned bottom-left over the poster gradient. */
  overlay?: ReactNode
  className?: string
}

/**
 * 16:9 sermon poster with a play affordance. The YouTube iframe is NOT
 * rendered until the user clicks — it costs ~500KB and blocks LCP.
 * Uses the youtube-nocookie embed domain with rel=0.
 */
export default function SermonPlayer({
  sermon,
  sizes,
  badge,
  overlay,
  className = '',
}: SermonPlayerProps) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className={`relative aspect-video overflow-hidden bg-surface-sunken ${className}`}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${sermon.id}?autoplay=1&rel=0`}
          title={sermon.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group relative block size-full text-left"
          aria-label={`Play: ${sermon.title}`}
        >
          {sermon.thumbnail && (
            <Image
              src={sermon.thumbnail}
              alt=""
              fill
              sizes={sizes}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
          />
          {badge && <span className="absolute left-4 top-4">{badge}</span>}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center border border-white/80 bg-black/30 text-white transition-colors duration-200 group-hover:bg-white group-hover:text-black">
              <Play className="size-6 fill-current" aria-hidden />
            </span>
          </span>
          {overlay && <span className="absolute bottom-0 left-0 p-6">{overlay}</span>}
        </button>
      )}
    </div>
  )
}
