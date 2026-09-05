'use client'
import Image from 'next/image'
import { useState } from 'react'
import { ExternalLink, Youtube } from 'lucide-react'
import Section from '@/components/layout/Section'
import ScrollRail from '@/components/layout/ScrollRail'
import SectionHeading from '@/components/layout/SectionHeading'
import Badge from '@/components/ui/Badge'
import Reveal from '@/components/ui/Reveal'
import SermonPlayer from '@/components/sermons/SermonPlayer'
import { formatAirDate, formatDuration, type Sermon } from '@/lib/sermons'
import { cn } from '@/lib/cn'

type LatestServicesProps = {
  sermons: Sermon[]
  youtubeUrl: string
}

/**
 * Recent services — the latest service as a large 16:9 player
 * (embed-on-click), the previous three as smaller posters: a desktop
 * row, a snap-scroll rail on mobile. Clicking a small poster promotes
 * it into the large player. Renders nothing when there is no data.
 */
export default function LatestServices({ sermons, youtubeUrl }: LatestServicesProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (sermons.length === 0) return null

  const active = sermons[Math.min(activeIndex, sermons.length - 1)]
  const previous = sermons.slice(1)
  const duration = formatDuration(active.durationSeconds)
  const airDate = formatAirDate(active.publishedAt)

  const smallCard = (sermon: Sermon, index: number, className = '') => (
    <button
      key={sermon.id}
      type="button"
      onClick={() => setActiveIndex(index)}
      aria-current={index === activeIndex ? 'true' : undefined}
      className={cn('group w-64 text-left md:w-auto', className)}
    >
      <span className="relative block aspect-video overflow-hidden bg-surface-sunken">
        {sermon.thumbnail && (
          <Image
            src={sermon.thumbnail}
            alt=""
            fill
            sizes="(min-width: 768px) 30vw, 16rem"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 border-2 transition-colors duration-200',
            index === activeIndex ? 'border-accent' : 'border-transparent group-hover:border-white/60'
          )}
        />
      </span>
      <span className="mt-3 block font-display text-subheading text-text-primary">
        {sermon.title}
      </span>
      <span className="mt-1 block text-body-sm text-text-muted">
        {formatAirDate(sermon.publishedAt)}
      </span>
    </button>
  )

  return (
    <Section rhythm="normal" sunken>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Recent Services"
          title="Catch up on recent services"
          lede="Missed a Sunday? Watch the latest services from Amazing Grace Ministries MN — every message, free, anytime."
        />
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group mb-1 inline-flex items-center gap-2 text-body font-semibold text-accent"
        >
          <Youtube className="size-4" aria-hidden />
          Subscribe on YouTube
        </a>
      </div>

      <Reveal className="mt-12">
        <SermonPlayer
          key={active.id}
          sermon={active}
          sizes="(min-width: 1024px) 80vw, 100vw"
          badge={<Badge variant="accent">{activeIndex === 0 ? 'Latest Service' : 'Service'}</Badge>}
          overlay={
            <>
              <span className="block font-display text-heading text-white">{active.title}</span>
              <span className="mt-1 block text-body-sm text-white/70">
                {[airDate, duration].filter(Boolean).join(' · ')}
              </span>
            </>
          }
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <a
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-body-sm font-semibold text-accent"
          >
            Watch on YouTube
            <ExternalLink className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          </a>
          <div className="flex items-center gap-2" role="tablist" aria-label="Choose a service">
            {sermons.map((sermon, index) => (
              <button
                key={sermon.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Show ${sermon.title}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'h-0.5 w-8 transition-colors duration-200',
                  index === activeIndex ? 'bg-accent' : 'bg-border-strong hover:bg-text-muted'
                )}
              />
            ))}
          </div>
        </div>
      </Reveal>

      {previous.length > 0 && (
        <Reveal delay={1} className="mt-10">
          <div className="hidden gap-6 md:grid md:grid-cols-3">
            {previous.map((sermon, i) => smallCard(sermon, i + 1))}
          </div>
          <div className="md:hidden">
            <ScrollRail label="Previous services">
              {previous.map((sermon, i) => smallCard(sermon, i + 1))}
            </ScrollRail>
          </div>
        </Reveal>
      )}
    </Section>
  )
}
