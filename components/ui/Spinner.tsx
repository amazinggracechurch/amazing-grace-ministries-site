import { cn } from '@/lib/cn'

export type SpinnerSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
}

type SpinnerProps = {
  size?: SpinnerSize
  className?: string
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex', className)}>
      <svg
        className={cn('animate-spin text-accent', sizeClasses[size])}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="opacity-90"
        />
      </svg>
      <span className="sr-only">Loading</span>
    </span>
  )
}
