import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent not-disabled:hover:bg-accent-hover not-disabled:hover:-translate-y-0.5',
  secondary:
    'border border-border-strong bg-surface-raised text-text-primary not-disabled:hover:-translate-y-0.5 not-disabled:hover:border-accent not-disabled:hover:text-accent',
  ghost: 'text-text-primary not-disabled:hover:bg-surface-sunken',
  // Underline wipe: a hairline that draws in from the left on hover.
  link: 'relative text-accent underline-offset-4 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-200 not-disabled:hover:after:scale-x-100',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-body-sm',
  md: 'px-4 py-2 text-body',
  lg: 'px-6 py-3 text-subheading',
}

const linkSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-body-sm',
  md: 'text-body',
  lg: 'text-subheading',
}

type BaseProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
}

export type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined
  }

export type ButtonAsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & {
    href: string
    disabled?: boolean
  }

export type ButtonProps = ButtonAsButton | ButtonAsLink

/**
 * Quiet editorial button. Pass `href` to render a next/link with the same
 * styling; a disabled link gets aria-disabled and is removed from tab order
 * (a native anchor has no disabled state).
 */
export default function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', className, children, ...rest } = props
  const classes = cn(
    base,
    variant === 'link' ? linkSizeClasses[size] : sizeClasses[size],
    variantClasses[variant],
    className
  )

  if (rest.href !== undefined) {
    const { href, disabled, ...anchorProps } = rest
    return (
      <Link
        href={href}
        className={cn(classes, disabled && 'pointer-events-none cursor-not-allowed opacity-50')}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        {...anchorProps}
      >
        {children}
      </Link>
    )
  }

  const { disabled, type, ...buttonProps } = rest
  return (
    <button
      type={type ?? 'button'}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={classes}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
