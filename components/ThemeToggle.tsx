'use client'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type Theme } from './ThemeProvider'

const ORDER: Theme[] = ['light', 'dark', 'system']
const LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${LABELS[theme]}. Switch to ${LABELS[next]}.`}
      title={`Theme: ${LABELS[theme]}`}
      className="w-10 h-10 flex items-center justify-center border border-border-subtle bg-surface-raised text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-accent"
    >
      {theme === 'light' && <Sun className="w-4 h-4" aria-hidden />}
      {theme === 'dark' && <Moon className="w-4 h-4" aria-hidden />}
      {theme === 'system' && <Monitor className="w-4 h-4" aria-hidden />}
    </button>
  )
}
