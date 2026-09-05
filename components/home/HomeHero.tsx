'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play } from 'lucide-react'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import type { SiteSettings } from '@/lib/admin/site-settings'
import { site } from '@/lib/site'
import { cn } from '@/lib/cn'

const slides = [
  {
    src: '/images/hero-worship.jpg',
    alt: 'A worship leader singing with joy as the congregation celebrates',
  },
  {
    src: '/images/hero-stage.jpg',
    alt: 'Women of the church leading worship from the stage',
  },
  {
    src: '/images/hero-preaching.jpg',
    alt: 'Pastor Nnaemeka Uchegbu preaching as the congregation raises their hands',
  },
]

const INTERVAL_MS = 6500

type HomeHeroProps = {
  address: SiteSettings['address']
  youtubeUrl: string
}

/**
 * Full-bleed photographic hero with a three-slide crossfade carousel.
 * The headline and CTAs stay constant — only the photography rotates.
 * Auto-advance pauses on hover/focus and is disabled entirely under
 * prefers-reduced-motion.
 */
export default function HomeHero({ address, youtubeUrl }: HomeHeroProps) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), INTERVAL_MS)
    return () => clearInterval(id)
  }, [paused])

  return (
    <section
      className="relative isolate flex min-h-svh items-end overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="100vw"
          aria-hidden={i !== active}
          className={cn(
            '-z-10 object-cover transition-opacity duration-1000',
            i === active ? 'ken-burns opacity-100' : 'opacity-0'
          )}
        />
      ))}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-black/40"
      />

      <div className="mx-auto w-full max-w-7xl px-6 pt-40 pb-24 md:pb-32">
        <Reveal>
          <p className="eyebrow text-white/70">Welcome to</p>
          <h1 className="mt-4 max-w-4xl font-display text-display-xl font-light tracking-display uppercase text-white">
            Amazing Grace Ministries
          </h1>
        </Reveal>
        <Reveal delay={1}>
          <p className="mt-6 max-w-xl font-display text-heading italic text-white/85">
            &ldquo;{site.heroVerse.text}&rdquo;
            <span className="ml-3 align-middle font-body text-body-sm not-italic tracking-wide text-white/60">
              — {site.heroVerse.reference}
            </span>
          </p>
        </Reveal>
        <Reveal delay={2}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="/plan-your-visit" size="lg">
              Plan Your Visit
            </Button>
            <Link
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/60 px-6 py-3 text-subheading font-semibold text-white transition-colors duration-200 hover:border-white hover:bg-white/10"
            >
              <Play className="size-4" aria-hidden />
              Watch Online
            </Link>
          </div>
        </Reveal>
        <Reveal delay={3}>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <p className="text-body-sm font-semibold tracking-wide text-white/70">
              Sundays 09:00 AM · {address.street}, {address.city}, {address.state}
            </p>
            <div className="flex items-center gap-2" role="tablist" aria-label="Hero photographs">
              {slides.map((slide, i) => (
                <button
                  key={slide.src}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Photo ${i + 1} of ${slides.length}`}
                  onClick={() => setActive(i)}
                  className={cn(
                    'h-0.5 w-10 transition-colors duration-300',
                    i === active ? 'bg-white' : 'bg-white/35 hover:bg-white/60'
                  )}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
