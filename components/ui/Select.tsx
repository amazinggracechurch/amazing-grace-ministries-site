'use client'
import { ChevronDown } from 'lucide-react'
import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type SelectProps = {
  label: string
  hint?: string
  error?: string
  wrapperClassName?: string
  /** Provide <option> elements as children. */
  children: React.ReactNode
} & SelectHTMLAttributes<HTMLSelectElement>

export default function Select({
  label,
  hint,
  error,
  wrapperClassName,
  className,
  id,
  children,
  ...selectProps
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const hintId = `${selectId}-hint`
  const errorId = `${selectId}-error`
  const describedBy = cn(hint && hintId, error && errorId) || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      <label htmlFor={selectId} className="text-body-sm font-semibold text-text-primary">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full appearance-none border border-border-subtle bg-surface-raised px-3 py-2 pr-10 text-body text-text-primary transition-colors duration-200 focus:border-accent disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger',
            className
          )}
          {...selectProps}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
        />
      </div>
      {hint && (
        <p id={hintId} className="text-caption text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
