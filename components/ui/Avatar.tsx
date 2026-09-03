import Image from 'next/image'
import { cn } from '@/lib/cn'

export type AvatarSize = 'sm' | 'md' | 'lg'

const sizeMap: Record<AvatarSize, { classes: string; pixels: number }> = {
  sm: { classes: 'size-8 text-caption', pixels: 32 },
  md: { classes: 'size-10 text-body-sm', pixels: 40 },
  lg: { classes: 'size-12 text-body', pixels: 48 },
}

export type AvatarProps = {
  /** Image source. Falls back to initials derived from `name`. */
  src?: string
  /** Full name — used for alt text and the initials fallback. */
  name: string
  size?: AvatarSize
  className?: string
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const { classes, pixels } = sizeMap[size]

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={pixels}
        height={pixels}
        className={cn('shrink-0 rounded-full object-cover', classes, className)}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-accent-subtle font-semibold text-accent',
        classes,
        className
      )}
    >
      {initials(name)}
    </span>
  )
}
