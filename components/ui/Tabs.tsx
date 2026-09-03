'use client'
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type TabItem = {
  value: string
  label: ReactNode
  panel: ReactNode
  disabled?: boolean
}

export type TabsProps = {
  tabs: TabItem[]
  /** Initially active tab. Defaults to the first enabled tab. */
  defaultValue?: string
  className?: string
}

/**
 * Tabs with roving tabindex and automatic activation: ArrowLeft/Right
 * (plus Home/End) move focus and select. One panel is mounted at a time.
 */
export default function Tabs({ tabs, defaultValue, className }: TabsProps) {
  const baseId = useId()
  const firstEnabled = tabs.find((tab) => !tab.disabled)?.value
  const [active, setActive] = useState(defaultValue ?? firstEnabled)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const selectByIndex = (index: number) => {
    const tab = tabs[index]
    if (!tab || tab.disabled) return
    setActive(tab.value)
    tabRefs.current[index]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.value === active)
    const enabledIndexes = tabs
      .map((tab, index) => (tab.disabled ? -1 : index))
      .filter((index) => index !== -1)
    if (enabledIndexes.length === 0) return

    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') {
      const after = enabledIndexes.filter((index) => index > currentIndex)
      nextIndex = after[0] ?? enabledIndexes[0]
    } else if (event.key === 'ArrowLeft') {
      const before = enabledIndexes.filter((index) => index < currentIndex)
      nextIndex = before[before.length - 1] ?? enabledIndexes[enabledIndexes.length - 1]
    } else if (event.key === 'Home') {
      nextIndex = enabledIndexes[0]
    } else if (event.key === 'End') {
      nextIndex = enabledIndexes[enabledIndexes.length - 1]
    }
    if (nextIndex !== null) {
      event.preventDefault()
      selectByIndex(nextIndex)
    }
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="flex gap-1 border-b border-border-subtle"
      >
        {tabs.map((tab, index) => {
          const selected = tab.value === active
          return (
            <button
              key={tab.value}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.value}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.value}`}
              tabIndex={selected ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => selectByIndex(index)}
              className={cn(
                '-mb-px border-b-2 px-4 py-2.5 text-body-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
                selected
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {tabs.map((tab) => {
        const selected = tab.value === active
        return (
          <div
            key={tab.value}
            role="tabpanel"
            id={`${baseId}-panel-${tab.value}`}
            aria-labelledby={`${baseId}-tab-${tab.value}`}
            hidden={!selected}
            className="pt-6"
          >
            {selected && tab.panel}
          </div>
        )
      })}
    </div>
  )
}
