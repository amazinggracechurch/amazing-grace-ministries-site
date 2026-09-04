import { cn } from '@/lib/cn'

export type SkeletonShape = 'line' | 'circle' | 'block'

const shapeClasses: Record<SkeletonShape, string> = {
  line: 'h-3 w-full',
  circle: 'size-10 rounded-full',
  block: 'h-24 w-full',
}

type SkeletonProps = {
  shape?: SkeletonShape
  className?: string
}

/** Loading placeholder. Decorative — always hidden from assistive tech. */
export default function Skeleton({ shape = 'line', className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse bg-surface-sunken', shapeClasses[shape], className)}
    />
  )
}
