'use client'
import { useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type TextareaProps = {
  label: string
  hint?: string
  error?: string
  wrapperClassName?: string
} & TextareaHTMLAttributes<HTMLTextAreaElement>

export default function Textarea({
  label,
  hint,
  error,
  wrapperClassName,
  className,
  id,
  rows = 4,
  ...textareaProps
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const hintId = `${textareaId}-hint`
  const errorId = `${textareaId}-error`
  const describedBy = cn(hint && hintId, error && errorId) || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      <label htmlFor={textareaId} className="text-body-sm font-semibold text-text-primary">
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-body text-text-primary transition-colors duration-200 placeholder:text-text-muted focus:border-accent disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger',
          className
        )}
        {...textareaProps}
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
