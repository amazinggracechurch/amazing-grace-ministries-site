import { Facebook, Mail, Twitter } from 'lucide-react'

type ShareLinksProps = {
  /** Absolute URL of the post. */
  url: string
  title: string
}

const linkClasses =
  'inline-flex items-center gap-2 text-body-sm font-semibold text-text-secondary transition-colors duration-200 hover:text-accent'

/**
 * Plain-anchor share links — no widgets, no third-party scripts. X and
 * Facebook open their composer in a new tab; email opens the mail client.
 */
export default function ShareLinks({ url, title }: ShareLinksProps) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const links = [
    {
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: <Twitter className="size-4" aria-hidden="true" />,
      external: true,
    },
    {
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <Facebook className="size-4" aria-hidden="true" />,
      external: true,
    },
    {
      label: 'Share by email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: <Mail className="size-4" aria-hidden="true" />,
      external: false,
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <span className="eyebrow text-text-muted">Share</span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          aria-label={link.label}
          {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={linkClasses}
        >
          {link.icon}
          {link.label.replace('Share on ', '').replace('Share by ', 'Email')}
        </a>
      ))}
    </div>
  )
}
