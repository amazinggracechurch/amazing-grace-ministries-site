import { Clock, Calendar, PlayCircle } from 'lucide-react'
import Link from 'next/link'

/**
 * Slim service-times strip. Sits below the fixed navbar and scrolls
 * away with the page. Content will come from settings/site in Phase 2.
 */
export default function AnnouncementBar() {
  return (
    <div className="mt-[72px] border-b border-border-subtle bg-surface-sunken">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-6 py-2 text-caption font-semibold tracking-wide text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 text-accent" aria-hidden />
          SUNDAYS 10:00 AM
        </span>
        <span aria-hidden className="hidden text-border-strong sm:inline">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5 text-accent" aria-hidden />
          WEDNESDAYS 7:00 PM
        </span>
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
