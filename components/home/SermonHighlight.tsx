import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'
import Section from '@/components/layout/Section'
import Reveal from '@/components/ui/Reveal'
import { site } from '@/lib/site'

/**
 * Latest message — one large poster with a play affordance that links
 * out to YouTube. Becomes the data-driven YouTube carousel in 6.3;
 * the composition stays, the data layer drops in.
 */
export default function SermonHighlight() {
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
          <a
            href={site.socials.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-video overflow-hidden"
            aria-label="Watch the latest message on YouTube"
          >
            <Image
              src="/images/sermon-pulpit.jpg"
              alt="Pastor Nnaemeka Uchegbu preaching from the stage during a service"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-16 items-center justify-center border border-white/80 bg-black/30 text-white transition-colors duration-200 group-hover:bg-white group-hover:text-black">
                <Play className="size-6 fill-current" aria-hidden />
              </span>
            </span>
            <span className="absolute bottom-0 left-0 p-6">
              <span className="eyebrow block text-white/70">Latest message</span>
              <span className="mt-2 block font-display text-heading text-white">
                &ldquo;The Promise Is Still Yes&rdquo;
              </span>
              <span className="mt-1 block text-body-sm text-white/70">
                Pastor Nnaemeka Uchegbu · May 12, 2025
              </span>
            </span>
          </a>
        </Reveal>
      </div>
    </Section>
  )
}
