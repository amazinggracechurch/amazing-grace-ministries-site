import Image from 'next/image'
import { BookOpen, ChevronRight, Clock, Play } from 'lucide-react'
import Section from '@/components/layout/Section'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import { site } from '@/lib/site'

/**
 * This week's message — details on the left, one large 16:9 poster with a
 * play affordance linking to the YouTube channel on the right. Mirrors the
 * home SermonHighlight composition; the YouTube data layer drops into this
 * layout later.
 */
export default function FeaturedSermon() {
  return (
    <Section rhythm="normal" id="latest">
      <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow text-accent">This Week&apos;s Message</p>
          <h2 className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary">
            &ldquo;The Promise Is Still Yes&rdquo;
          </h2>
          <p className="mt-3 font-display text-subheading italic text-accent">Numbers 23:19</p>
          <p className="mt-6 max-w-md text-body text-text-secondary">
            God&apos;s promises are not subject to circumstances, seasons, or setbacks. In this
            powerful message, Pastor Nnaemeka Uchegbu walks us through why the promise over your
            life remains yes and amen &mdash; no matter what you&apos;re facing.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden />
              42 min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-3.5" aria-hidden />
              Numbers 23:19
            </span>
            <span>May 12, 2025</span>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href={site.socials.youtube} target="_blank" rel="noopener noreferrer" size="lg">
              <Play className="size-4" aria-hidden />
              Watch Now
            </Button>
            <Button
              href="mailto:?subject=The%20Promise%20Is%20Still%20Yes%20-%20Amazing%20Grace%20Ministries%20MN&body=Check%20out%20this%20sermon%20from%20Amazing%20Grace%20Ministries%20MN:%20The%20Promise%20Is%20Still%20Yes."
              variant="secondary"
              size="lg"
            >
              Share
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </Reveal>

        <Reveal delay={1} className="lg:col-span-7">
          <a
            href={site.socials.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-video overflow-hidden"
            aria-label="Play Featured Sermon"
          >
            <Image
              src="/images/hero-stage.jpg"
              alt="Worship leaders on stage during a service at Amazing Grace Ministries"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
            />
            <span className="absolute left-4 top-4">
              <Badge variant="accent">Latest Message</Badge>
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-16 items-center justify-center border border-white/80 bg-black/30 text-white transition-colors duration-200 group-hover:bg-white group-hover:text-black">
                <Play className="size-6 fill-current" aria-hidden />
              </span>
            </span>
            <span className="absolute bottom-0 left-0 p-6">
              <span className="eyebrow block text-white/70">Living in the Promise</span>
            </span>
          </a>
        </Reveal>
      </div>
    </Section>
  )
}
