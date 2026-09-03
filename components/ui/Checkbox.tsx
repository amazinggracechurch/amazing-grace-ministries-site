import { Check } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type CheckboxProps = {
  label: ReactNode
  hint?: string
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>

/**
 * Native checkbox (keyboard-operable out of the box) with a token-styled
 * box. The label wraps the input, so clicking the text toggles it.
 */
export default function Checkbox({ label, hint, className, disabled, ...inputProps }: CheckboxProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <input type="checkbox" disabled={disabled} className="peer sr-only" {...inputProps} />
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-border-strong bg-surface-raised text-transparent transition-colors duration-200 peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
      >
        <Check className="size-3" strokeWidth={3.5} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-body-sm font-semibold text-text-primary">{label}</span>
        {hint && <span className="text-caption text-text-muted">{hint}</span>}
      </span>
    </label>
  )
}
