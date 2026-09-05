import { Bell, ExternalLink, Youtube } from 'lucide-react'
import FullBleed from '@/components/layout/FullBleed'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import { getSiteSettings } from '@/lib/site-settings'

const stats = [
  { number: '1400+', label: 'Messages Preached' },
  { number: '3', label: 'Sermon Series' },
  { number: '100+', label: 'Countries Reached' },
]

/**
 * Subscribe CTA — full-bleed black-and-white worship photograph, the
 * page's closing centered statement.
 */
export default async function YouTubeCTA() {
  const settings = await getSiteSettings()
  return (
    <FullBleed
      src="/images/worship-band-bw.jpg"
      alt="The church band — keys, guitar, and saxophone — leading worship, in black and white"
      height="band"
      align="center"
    >
      <Reveal>
        <h2 className="mx-auto max-w-2xl font-display text-display-md font-medium tracking-display">
          Never Miss a <span className="italic">Sunday Message.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-subheading text-white/80">
          Subscribe to the Amazing Grace Ministries MN YouTube channel and get notified every time a
          new message drops. Every sermon, every series &mdash; available free, forever.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button href={settings.socials.youtube} target="_blank" rel="noopener noreferrer" size="lg">
            <Youtube className="size-4" aria-hidden />
            Subscribe on YouTube
            <ExternalLink className="size-3" aria-hidden />
          </Button>
          <a
            href={settings.socials.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-white/60 px-6 py-3 text-subheading font-semibold text-white transition-colors duration-200 hover:border-white hover:bg-white/10"
          >
            <Bell className="size-4" aria-hidden />
            Turn on Notifications
          </a>
        </div>
        <dl className="mt-14 flex flex-col items-center justify-center gap-10 sm:flex-row sm:gap-14">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dd className="font-display text-display-md font-light leading-none">{stat.number}</dd>
              <dt className="eyebrow mt-2 text-white/60">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </Reveal>
    </FullBleed>
  )
}
