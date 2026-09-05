import { ArrowUpRight } from 'lucide-react'
import Reveal from '@/components/ui/Reveal'
import { getSiteSettings } from '@/lib/site-settings'

/**
 * Service times as a confident typographic band — always dark, the
 * showroom-contrast moment of the page. No icon cards; the times
 * themselves are the design.
 */
export default async function ServiceTimesBand() {
  const settings = await getSiteSettings()
  return (
    <section aria-labelledby="service-times-heading" className="dark bg-surface text-text-primary">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="service-times-heading" className="font-display text-display-md font-light uppercase tracking-display">
              Gather With Us
            </h2>
            <a
              href={settings.address.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-body-sm font-semibold text-text-secondary transition-colors duration-200 hover:text-accent"
            >
              {settings.address.street}, {settings.address.city}, {settings.address.state} {settings.address.zip}
              <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </a>
          </div>
        </Reveal>

        <dl className="mt-14 grid grid-cols-1 border-t border-border-subtle sm:grid-cols-2 lg:grid-cols-4">
          {settings.services.map((service, i) => (
            <Reveal
              key={service.name}
              delay={Math.min(i, 4) as 0 | 1 | 2 | 3 | 4}
              className="border-b border-border-subtle py-8 sm:px-6 sm:first:pl-0 sm:last:pr-0 lg:border-b-0"
            >
              <dt className="eyebrow text-text-muted">{service.name}</dt>
              <dd className="mt-3 font-display text-display-md font-light leading-none">
                {service.time}
              </dd>
              <dd className="mt-2 text-body-sm font-semibold text-text-secondary">
                {service.day}
              </dd>
              <dd className="mt-1 text-caption text-text-muted">{service.note}</dd>
            </Reveal>
          ))}
        </dl>

        <Reveal delay={2}>
          <p className="mt-12 text-body-sm text-text-secondary">
            Join by phone:{' '}
            {settings.dialIn.numbers.map((n) => (
              <a
                key={n}
                href={`tel:+1${n.replaceAll('-', '')}`}
                className="font-semibold text-text-primary underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
              >
                {n}
              </a>
            )).reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, ' or ', el]), [])}
            {' '}· Code {settings.dialIn.code}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
