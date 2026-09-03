'use client'
import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type InputProps = {
  label: string
  hint?: string
  error?: string
  wrapperClassName?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>

export default function Input({
  label,
  hint,
  error,
  wrapperClassName,
  className,
  id,
  ...inputProps
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = cn(hint && hintId, error && errorId) || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      <label htmlFor={inputId} className="text-body-sm font-semibold text-text-primary">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-body text-text-primary transition-colors duration-200 placeholder:text-text-muted focus:border-accent disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger',
          className
        )}
        {...inputProps}
      />
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
