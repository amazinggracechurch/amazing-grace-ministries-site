export type ProgressBarProps = {
  /** Amount raised / completed. */
  value: number
  max?: number
  /**
   * Optional secondary amount (e.g. pledged but not yet received),
   * rendered as a lighter segment behind the main fill.
   */
  pledged?: number
  label?: string
  className?: string
}

export default function ProgressBar({
  value,
  max = 100,
  pledged,
  label,
  className,
}: ProgressBarProps) {
  const percent = (amount: number) =>
    `${Math.min(100, Math.max(0, (amount / max) * 100))}%`

  return (
    <div className={className}>
      {label && (
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <span className="text-body-sm font-semibold text-text-primary">{label}</span>
          <span className="text-caption text-text-muted">
            {Math.round((value / max) * 100)}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? 'Progress'}
        className="relative h-2 overflow-hidden rounded-full bg-surface-sunken"
      >
        {pledged !== undefined && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent-subtle"
            style={{ width: percent(pledged) }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: percent(value) }}
        />
      </div>
    </div>
  )
}
