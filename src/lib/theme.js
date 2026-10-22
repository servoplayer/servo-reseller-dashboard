import { useCallback, useState } from 'react'

const KEY = 'servo-theme'

const isDark = () => document.documentElement.classList.contains('dark')

/** Light/dark theme; the initial class is set by an inline script in index.html. */
export function useTheme() {
  const [dark, setDark] = useState(isDark)
  const toggle = useCallback(() => {
    const next = !isDark()
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light')
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this session.
    }
    setDark(next)
  }, [])
  return { dark, toggle }
}
