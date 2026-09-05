import { ArrowRight, Facebook, Instagram, Youtube } from 'lucide-react'
import Link from 'next/link'
import Reveal from '@/components/ui/Reveal'
import { getSiteSettings } from '@/lib/site-settings'

/**
 * Stay-connected band — always dark, the quiet closing moment of the page.
 * Social links are small inline affordances; the type does the work.
 */
export default async function ConnectStrip() {
  const settings = await getSiteSettings()
  const socials = [
    { icon: Facebook, label: 'Facebook', href: settings.socials.facebook },
    { icon: Instagram, label: 'Instagram', href: settings.socials.instagram },
    { icon: Youtube, label: 'YouTube', href: settings.socials.youtube },
  ]
  return (
    <section className="dark bg-surface text-text-primary">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow text-text-muted">Stay connected</p>
            <h2 className="mt-4 font-display text-display-md font-medium tracking-display">
              Follow Our Journey.{' '}
              <span className="italic text-text-secondary">Join the Conversation.</span>
            </h2>
            <p className="mt-6 max-w-xl text-body text-text-secondary">
              Stay up to date with sermons, events, announcements, and behind-the-scenes
              moments from the Amazing Grace family.
            </p>
          </Reveal>

          <Reveal delay={1} className="lg:col-span-5">
            <ul className="border-t border-border-subtle">
              {socials.map((social) => {
                const Icon = social.icon
                return (
                  <li key={social.label} className="border-b border-border-subtle">
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between py-4 text-body font-semibold transition-colors duration-200 hover:text-accent"
                    >
                      <span className="inline-flex items-center gap-3">
                        <Icon className="size-4 text-text-muted transition-colors duration-200 group-hover:text-accent" aria-hidden />
                        {social.label}
                      </span>
                      <ArrowRight className="size-4 text-text-muted transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                    </a>
                  </li>
                )
              })}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={2}>
          <p className="mt-14 border-t border-border-subtle pt-8 text-body text-text-secondary">
            Ready to visit in person?{' '}
            <Link
              href="/plan-your-visit"
              className="group ml-2 inline-flex items-center gap-1.5 font-semibold text-text-primary transition-colors duration-200 hover:text-accent"
            >
              Plan Your Visit
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
