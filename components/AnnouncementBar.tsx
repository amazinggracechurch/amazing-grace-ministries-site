import { Clock, Calendar, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/site-settings'

/**
 * Slim service-times strip. Sits below the fixed navbar and scrolls
 * away with the page. Shows the settings/site announcement when one is
 * enabled; otherwise the Sunday and midweek service times.
 */
export default async function AnnouncementBar() {
  const settings = await getSiteSettings()
  const sunday =
    settings.services.find((service) => /sunday/i.test(service.day)) ??
    settings.services[0]
  const midweek =
    settings.services.find((service) => /wednesday/i.test(service.day)) ??
    settings.services[1] ??
    settings.services[0]

  return (
    <div className="mt-[72px] border-b border-border-subtle bg-surface-sunken">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-6 py-2 text-caption font-semibold tracking-wide text-text-secondary">
        {settings.announcement.enabled && settings.announcement.text ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-accent" aria-hidden />
            {settings.announcement.text}
          </span>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-accent" aria-hidden />
              {sunday.day.toUpperCase()} {sunday.time}
            </span>
            <span aria-hidden className="hidden text-border-strong sm:inline">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5 text-accent" aria-hidden />
              {midweek.day.toUpperCase()} {midweek.time}
            </span>
          </>
        )}
        <span aria-hidden className="hidden text-border-strong md:inline">|</span>
        <Link
          href="/sermons"
          className="inline-flex items-center gap-1.5 text-accent transition-colors duration-200 hover:text-accent-hover"
        >
          <PlayCircle className="size-3.5" aria-hidden />
          WATCH ONLINE
        </Link>
      </div>
    </div>
  )
}
