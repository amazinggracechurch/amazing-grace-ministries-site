'use client'
import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type AccordionItem = {
  title: ReactNode
  content: ReactNode
}

export type AccordionProps = {
  items: AccordionItem[]
  /** Allow more than one open panel. Defaults to single-open. */
  allowMultiple?: boolean
  /** Indexes open on first render. */
  defaultOpen?: number[]
  className?: string
}

export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className,
}: AccordionProps) {
  const baseId = useId()
  const [openItems, setOpenItems] = useState<number[]>(defaultOpen)

  const toggle = (index: number) => {
    setOpenItems((current) => {
      const isOpen = current.includes(index)
      if (allowMultiple) {
        return isOpen ? current.filter((i) => i !== index) : [...current, index]
      }
      return isOpen ? [] : [index]
    })
  }

  return (
    <div className={cn('divide-y divide-border-subtle border-y border-border-subtle', className)}>
      {items.map((item, index) => {
        const isOpen = openItems.includes(index)
        const buttonId = `${baseId}-trigger-${index}`
        const panelId = `${baseId}-panel-${index}`
        return (
          <div key={index}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-body font-semibold text-text-primary transition-colors duration-200 hover:text-accent"
              >
                {item.title}
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'size-4 shrink-0 text-text-muted transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="pb-5 text-body text-text-secondary"
            >
              {item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
