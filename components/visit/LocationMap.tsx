import { ArrowUpRight } from 'lucide-react'
import Section from '@/components/layout/Section'
import SectionHeading from '@/components/layout/SectionHeading'
import Reveal from '@/components/ui/Reveal'
import { getSiteSettings } from '@/lib/site-settings'
import { site } from '@/lib/site'

const MAP_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2943.7107222090467!2d-93.0790403344524!3d44.96266734038071!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x52b2d535db58a159%3A0x30db70624ab5b834!2sAmazing%20Grace%20MN!5e1!3m2!1sen!2sng!4v1784043618752!5m2!1sen!2sng'

/**
 * Location — the map is the hero of this section, full-width with a
 * sharp border. Below it: address + directions, parking, contact, and
 * the dial-in numbers as large tappable tel: links.
 */
export default async function LocationMap() {
  const settings = await getSiteSettings()
  return (
    <Section rhythm="normal" sunken>
      <Reveal>
        <SectionHeading eyebrow="Find Us" title="Our Location" />
      </Reveal>

      <Reveal delay={1}>
        <div className="mt-12 border border-border-strong">
          <iframe
            title={`Map to ${site.name}, ${settings.address.street}, ${settings.address.city}, ${settings.address.state} ${settings.address.zip}`}
            src={MAP_EMBED_SRC}
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="block h-[420px] w-full"
          />
        </div>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal delay={1}>
          <p className="eyebrow text-text-muted">Address</p>
          <p className="mt-3 font-display text-heading font-medium text-text-primary">
            {settings.address.street}
          </p>
          <p className="mt-1 text-body text-text-secondary">
            {settings.address.city}, {settings.address.state} {settings.address.zip}
          </p>
          <a
            href={settings.address.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-4 inline-flex items-center gap-1.5 text-body-sm font-semibold text-accent transition-colors duration-200 hover:text-accent-hover"
          >
            Get Directions
            <ArrowUpRight
              aria-hidden
              className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        </Reveal>

        <Reveal delay={2}>
          <p className="eyebrow text-text-muted">Parking</p>
          <p className="mt-3 text-body text-text-secondary">
            Free parking is available in the main lot adjacent to the building.
            Accessible spaces are located near the main entrance.
          </p>
        </Reveal>

        <Reveal delay={3}>
          <p className="eyebrow text-text-muted">Contact</p>
          <p className="mt-3 text-body-sm font-semibold text-text-muted">Phone</p>
          <a
            href={`tel:+1${settings.contact.phone.replace(/\D/g, '')}`}
            className="mt-1 block text-body font-semibold text-text-primary transition-colors duration-200 hover:text-accent"
          >
            {settings.contact.phone}
          </a>
          <p className="mt-4 text-body-sm font-semibold text-text-muted">Email</p>
          <a
            href={`mailto:${settings.contact.email}`}
            className="mt-1 block text-body font-semibold text-text-primary transition-colors duration-200 hover:text-accent"
          >
            {settings.contact.email}
          </a>
        </Reveal>

        <Reveal delay={4}>
          <p className="eyebrow text-text-muted">Join by Phone</p>
          <div className="mt-3 space-y-1">
            {settings.dialIn.numbers.map((number) => (
              <a
                key={number}
                href={`tel:+1${number.replaceAll('-', '')}`}
                className="block font-display text-heading font-medium text-text-primary transition-colors duration-200 hover:text-accent"
              >
                {number}
              </a>
            ))}
          </div>
          <p className="mt-2 text-body-sm text-text-secondary">
            Access Code: {settings.dialIn.code}
          </p>
        </Reveal>
      </div>
    </Section>
  )
}
