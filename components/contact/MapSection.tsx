import { Navigation } from 'lucide-react'
import Reveal from '@/components/ui/Reveal'
import SectionHeading from '@/components/layout/SectionHeading'
import { getSiteSettings } from '@/lib/site-settings'

/**
 * Full-width Google Maps embed — the map itself is the visual, edge to edge.
 * Parking and transit notes sit below as a quiet two-column editorial block.
 */
export default async function MapSection() {
  const settings = await getSiteSettings()
  return (
    <section className="bg-surface-sunken">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-12 md:pt-24 md:pb-14">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="How to find us"
              title={
                <>
                  We&apos;re Located in{' '}
                  <span className="italic text-text-secondary">Saint Paul, Minnesota.</span>
                </>
              }
            />
            <a
              href={settings.address.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-body-sm font-semibold text-text-secondary transition-colors duration-200 hover:text-accent"
            >
              <Navigation className="size-4" aria-hidden />
              Get Directions
            </a>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <iframe
          title="Map to Amazing Grace Ministries MN, 715 Edgerton Street, Saint Paul, MN"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2943.7107222090467!2d-93.0790403344524!3d44.96266734038071!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x52b2d535db58a159%3A0x30db70624ab5b834!2sAmazing%20Grace%20MN!5e1!3m2!1sen!2sng!4v1784043618752!5m2!1sen!2sng"
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="block h-[380px] w-full border-0 md:h-[520px]"
        />
      </Reveal>

      <div className="mx-auto max-w-7xl px-6 py-14 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <Reveal>
            <p className="eyebrow text-text-muted">Parking</p>
            <p className="mt-3 max-w-md text-body text-text-secondary">
              Free parking is available in our main lot. Overflow parking is across the
              street. Accessible spaces are near the main entrance.
            </p>
          </Reveal>
          <Reveal delay={1}>
            <p className="eyebrow text-text-muted">Public Transport</p>
            <p className="mt-3 max-w-md text-body text-text-secondary">
              We are accessible by Metro Transit bus routes. The nearest stop is Edgerton St
              &amp; Payne Ave, a 3-minute walk from the church.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
