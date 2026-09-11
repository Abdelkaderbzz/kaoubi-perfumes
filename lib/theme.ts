export const THEME_STORAGE_KEY = 'kaoubi-theme'
export type Theme = 'light' | 'dark'
export const defaultTheme: Theme = 'light'

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Private mode — theme still applies for this visit.
  }
}

export function readDocumentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}
