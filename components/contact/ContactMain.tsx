import { Facebook, Instagram, Youtube } from 'lucide-react'
import Section from '@/components/layout/Section'
import Reveal from '@/components/ui/Reveal'
import ContactForm from './ContactForm'
import { departments } from './departments'
import { getSiteSettings } from '@/lib/site-settings'

/**
 * The working core of the page: an asymmetric split — a typographic
 * contact/departments block on the left, the message form on the right.
 */
export default async function ContactMain() {
  const settings = await getSiteSettings()
  const socials = [
    { icon: Facebook, label: 'Facebook', href: settings.socials.facebook },
    { icon: Instagram, label: 'Instagram', href: settings.socials.instagram },
    { icon: Youtube, label: 'YouTube', href: settings.socials.youtube },
  ]
  return (
    <Section rhythm="normal">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
        {/* ===== Left — typographic contact block ===== */}
        <Reveal className="lg:col-span-5">
          <p className="eyebrow text-accent">Reach the right team</p>
          <h2
            id="contact-main-heading"
            className="mt-4 font-display text-display-md font-medium tracking-display text-text-primary"
          >
            Get in Touch{' '}
            <span className="block italic text-text-secondary">With the Right Person.</span>
          </h2>
          <p className="mt-6 max-w-md text-body text-text-secondary">
            Whether you have a general question, need prayer, or want to connect with a
            specific ministry &mdash; we have a team ready to help. Select a department below
            and we&apos;ll make sure your message gets to the right person.
          </p>

          {/* Departments — editorial list */}
          <ul className="mt-10 border-t border-border-subtle">
            {departments.map((dept) => (
              <li
                key={dept.name}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border-subtle py-4"
              >
                <span className="text-body font-semibold text-text-primary">{dept.name}</span>
                <a
                  href={`mailto:${dept.email}`}
                  className="text-body-sm text-text-secondary underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
                >
                  {dept.email}
                </a>
              </li>
            ))}
          </ul>

          {/* Church information */}
          <h3 className="mt-12 eyebrow text-accent">Find us</h3>
          <dl className="mt-4 border-t border-border-subtle">
            <div className="border-b border-border-subtle py-4">
              <dt className="eyebrow text-text-muted">Address</dt>
              <dd className="mt-1 text-body text-text-primary">
                <a
                  href={settings.address.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
                >
                  {settings.address.street}
                  <br />
                  {settings.address.city}, {settings.address.state} {settings.address.zip}
                </a>
              </dd>
            </div>
            <div className="border-b border-border-subtle py-4">
              <dt className="eyebrow text-text-muted">Phone</dt>
              <dd className="mt-1 text-body text-text-primary">
                <a
                  href={`tel:+1${settings.contact.phone.replace(/\D/g, '')}`}
                  className="underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
                >
                  {settings.contact.phone}
                </a>
              </dd>
            </div>
            <div className="border-b border-border-subtle py-4">
              <dt className="eyebrow text-text-muted">Email</dt>
              <dd className="mt-1 text-body text-text-primary">
                <a
                  href={`mailto:${settings.contact.email}`}
                  className="underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
                >
                  {settings.contact.email}
                </a>
              </dd>
            </div>
            <div className="border-b border-border-subtle py-4">
              <dt className="eyebrow text-text-muted">Join services by phone</dt>
              <dd className="mt-1 text-body text-text-primary">
                {settings.dialIn.numbers.map((n) => (
                  <a
                    key={n}
                    href={`tel:+1${n.replaceAll('-', '')}`}
                    className="underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
                  >
                    {n}
                  </a>
                )).reduce<React.ReactNode[]>(
                  (acc, el, i) => (i === 0 ? [el] : [...acc, ' or ', el]),
                  []
                )}
              </dd>
              <dd className="mt-1 text-body-sm text-text-muted">
                Access Code: {settings.dialIn.code}
              </dd>
            </div>
          </dl>

          {/* Socials — quiet inline affordances */}
          <div className="mt-8 flex flex-wrap items-center gap-5">
            {socials.map((social) => {
              const Icon = social.icon
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-body-sm font-semibold text-text-secondary transition-colors duration-200 hover:text-accent"
                >
                  <Icon className="size-4" aria-hidden />
                  {social.label}
                </a>
              )
            })}
          </div>
        </Reveal>

        {/* ===== Right — the form ===== */}
        <Reveal delay={1} className="lg:col-span-7">
          <ContactForm contact={settings.contact} />
        </Reveal>
      </div>
    </Section>
  )
}
