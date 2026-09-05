'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Section from '@/components/layout/Section'
import ScrollRail from '@/components/layout/ScrollRail'
import Reveal from '@/components/ui/Reveal'
import SermonPlayer from '@/components/sermons/SermonPlayer'
import { formatAirDate, type Sermon } from '@/lib/sermons'
import { cn } from '@/lib/cn'

type SermonHighlightProps = {
  sermons: Sermon[]
}

/**
 * Latest message — the 5/7 text + poster composition, now data-driven
 * from the YouTube channel with embed-on-click. The previous three
 * services sit in a rail below; clicking one promotes it into the
 * large player. Renders nothing when there is no data.
 */
export default function SermonHighlight({ sermons }: SermonHighlightProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (sermons.length === 0) return null

  const active = sermons[Math.min(activeIndex, sermons.length - 1)]
  const previous = sermons.slice(1)

  const smallCard = (sermon: Sermon, index: number) => (
    <button
      key={sermon.id}
      type="button"
      onClick={() => setActiveIndex(index)}
      aria-current={index === activeIndex ? 'true' : undefined}
      className="group w-64 text-left md:w-auto"
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
    <Section rhythm="normal">
      <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow text-accent">Watch &amp; Listen</p>
          <h2 className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary">
            Listen to our sermons
          </h2>
          <p className="mt-6 max-w-md text-body text-text-secondary">
            Experience powerful, biblical teachings that will challenge, encourage, and build up
            your faith. Watch live online or listen to past messages anytime, anywhere.
          </p>
          <div className="mt-8">
            <Link
              href="/sermons"
              className="group inline-flex items-center gap-2 text-body font-semibold text-accent"
            >
              Explore sermons
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={1} className="lg:col-span-7">
          <SermonPlayer
            key={active.id}
            sermon={active}
            sizes="(min-width: 1024px) 58vw, 100vw"
            overlay={
              <>
                <span className="eyebrow block text-white/70">
                  {activeIndex === 0 ? 'Latest message' : 'Recent message'}
                </span>
                <span className="mt-2 block font-display text-heading text-white">
                  {active.title}
                </span>
                <span className="mt-1 block text-body-sm text-white/70">
                  {formatAirDate(active.publishedAt)}
                </span>
              </>
            }
          />
        </Reveal>
      </div>

      {previous.length > 0 && (
        <Reveal delay={2} className="mt-10">
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
