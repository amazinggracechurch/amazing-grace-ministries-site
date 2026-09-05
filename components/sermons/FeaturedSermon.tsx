'use client'
import { ChevronRight, Clock, Play } from 'lucide-react'
import Section from '@/components/layout/Section'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import SermonPlayer from '@/components/sermons/SermonPlayer'
import { formatAirDate, formatDuration, type Sermon } from '@/lib/sermons'

type FeaturedSermonProps = {
  sermon?: Sermon
}

/**
 * This week's message — details on the left, one large 16:9 player with
 * embed-on-click on the right. Data-driven from the YouTube channel;
 * renders nothing when there is no data.
 */
export default function FeaturedSermon({ sermon }: FeaturedSermonProps) {
  if (!sermon) return null

  const duration = formatDuration(sermon.durationSeconds)
  const airDate = formatAirDate(sermon.publishedAt)

  return (
    <Section rhythm="normal" id="latest">
      <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow text-accent">This Week&apos;s Message</p>
          <h2 className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary">
            {sermon.title}
          </h2>
          <p className="mt-6 max-w-md text-body text-text-secondary">
            The latest message from Amazing Grace Ministries MN. Watch right here, or on our
            YouTube channel where every service is available free, anytime.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm text-text-muted">
            {duration && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden />
                {duration}
              </span>
            )}
            {airDate && <span>{airDate}</span>}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href={sermon.url} target="_blank" rel="noopener noreferrer" size="lg">
              <Play className="size-4" aria-hidden />
              Watch on YouTube
            </Button>
            <Button
              href={`mailto:?subject=${encodeURIComponent(`${sermon.title} - Amazing Grace Ministries MN`)}&body=${encodeURIComponent(`Check out this message from Amazing Grace Ministries MN: ${sermon.url}`)}`}
              variant="secondary"
              size="lg"
            >
              Share
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </Reveal>

        <Reveal delay={1} className="lg:col-span-7">
          <SermonPlayer
            sermon={sermon}
            sizes="(min-width: 1024px) 58vw, 100vw"
            badge={<Badge variant="accent">Latest Message</Badge>}
            overlay={<span className="eyebrow block text-white/70">{airDate}</span>}
          />
        </Reveal>
      </div>
    </Section>
  )
}
