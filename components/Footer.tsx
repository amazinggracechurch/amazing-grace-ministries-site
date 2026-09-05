import { Facebook, Instagram, Youtube, MapPin, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/site-settings'
import { site } from '@/lib/site'

const quickLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Plan Your Visit', href: '/plan-your-visit' },
  { label: 'Sermons', href: '/sermons' },
  { label: 'Blog', href: '/blog' },
  { label: 'Events', href: '/events' },
  { label: 'Shop', href: '/shop' },
  { label: 'Give', href: '/give' },
  { label: 'Contact Us', href: '/contact' },
]

export default async function Footer() {
  const settings = await getSiteSettings()
  const socials = [
    { label: 'Facebook', href: settings.socials.facebook, Icon: Facebook },
    { label: 'Instagram', href: settings.socials.instagram, Icon: Instagram },
    { label: 'YouTube', href: settings.socials.youtube, Icon: Youtube },
  ]
  return (
    <footer className="dark bg-surface text-text-primary">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-white.svg"
                alt=""
                width={44}
                height={44}
                className="object-contain"
              />
              <span>
                <span className="block font-display text-heading font-semibold leading-tight">
                  Amazing Grace
                </span>
                <span className="eyebrow block text-text-muted">Ministries MN</span>
              </span>
            </Link>
            <p className="mt-6 max-w-sm font-display text-subheading italic text-text-secondary">
              &ldquo;{site.heroVerse.text}&rdquo; — {site.heroVerse.reference}
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Amazing Grace Ministries on ${label}`}
                  className="flex size-10 items-center justify-center border border-border-subtle text-text-secondary transition-colors duration-200 hover:border-accent hover:text-accent"
                >
                  <Icon className="size-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer" className="md:col-span-3">
            <h2 className="eyebrow text-text-muted">Quick Links</h2>
            <ul className="mt-5 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-text-secondary transition-colors duration-200 hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Service times + location */}
          <div className="md:col-span-4">
            <h2 className="eyebrow text-text-muted">Service Times</h2>
            <ul className="mt-5 space-y-2 text-body-sm text-text-secondary">
              <li>Sundays: 09:00 AM</li>
              <li>Mondays: Bible Study</li>
              <li>Wednesdays: Hour of Battle</li>
              <li>1st Saturday: Open Heavens</li>
            </ul>
            <p className="mt-4 text-caption text-text-muted">
              Audio:{' '}
              {settings.dialIn.numbers.map((n) => (
                <a key={n} href={`tel:+1${n.replaceAll('-', '')}`} className="transition-colors duration-200 hover:text-accent">
                  {n}
                </a>
              )).reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, ' or ', el]), [])}
              {' '}· Code {settings.dialIn.code}
            </p>

            <h2 className="eyebrow mt-8 text-text-muted">Location</h2>
            <p className="mt-4 flex items-start gap-2 text-body-sm text-text-secondary">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>
                {settings.address.street}
                <br />
                {settings.address.city}, {settings.address.state} {settings.address.zip}
              </span>
            </p>
            <a
              href={settings.address.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-3 inline-flex items-center gap-1.5 text-body-sm font-semibold text-accent"
            >
              Get Directions
              <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </a>
          </div>
        </div>

        <div className="mt-14 border-t border-border-subtle pt-6 text-caption text-text-muted">
          © {new Date().getFullYear()} Amazing Grace Ministries MN — All Rights Reserved
        </div>
      </div>
    </footer>
  )
}
