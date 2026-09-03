'use client'
import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'agm-theme'
const CHANGE_EVENT = 'agm-theme-change'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const ThemeContext = createContext<{
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}>({ theme: 'system', resolvedTheme: 'dark', setTheme: () => {} })

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

function subscribeTheme(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function subscribeSystemDark(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server snapshots match the anti-flash script's default ("system"),
  // so hydration is clean; the client snapshots take over after mount.
  const theme = useSyncExternalStore(subscribeTheme, readStoredTheme, () => 'system' as Theme)
  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false
  )
  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  // Enable the theme cross-fade only after first paint to avoid a flash.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      document.documentElement.classList.add('theme-transitions')
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  const setTheme = (next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
