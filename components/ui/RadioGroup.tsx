'use client'
import { useId } from 'react'
import { cn } from '@/lib/cn'

export type RadioOption = {
  value: string
  label: string
  hint?: string
  disabled?: boolean
}

export type RadioGroupProps = {
  /** Visible group label, rendered as the fieldset legend. */
  legend: string
  name: string
  options: RadioOption[]
  /** Controlled value. Pair with onValueChange. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  onValueChange?: (value: string) => void
  direction?: 'vertical' | 'horizontal'
  error?: string
  className?: string
}

/**
 * Native radio inputs, so roving tabindex and arrow-key navigation come
 * from the browser. The visual control is a token-styled span driven by
 * peer-checked on the sr-only input.
 */
export default function RadioGroup({
  legend,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  direction = 'vertical',
  error,
  className,
}: RadioGroupProps) {
  const groupId = useId()
  const errorId = `${groupId}-error`

  return (
    <fieldset
      className={cn('flex flex-col gap-2', className)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="mb-1 text-body-sm font-semibold text-text-primary">{legend}</legend>
      <div className={cn('flex gap-4', direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap')}>
        {options.map((option) => {
          const checked = value !== undefined ? value === option.value : undefined
          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3',
                option.disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                defaultChecked={value === undefined ? option.value === defaultValue : undefined}
                disabled={option.disabled}
                onChange={onValueChange ? () => onValueChange(option.value) : undefined}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="relative mt-0.5 size-4 shrink-0 rounded-full border border-border-strong bg-surface-raised transition-colors duration-200 after:absolute after:inset-1 after:rounded-full after:bg-accent after:transition-transform after:duration-200 after:scale-0 peer-checked:border-accent peer-checked:after:scale-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-body-sm font-semibold text-text-primary">{option.label}</span>
                {option.hint && <span className="text-caption text-text-muted">{option.hint}</span>}
              </span>
            </label>
          )
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
