export type ThemeMode = 'light' | 'dark'

/** Coerce legacy `system` (and unknown values) to light or dark only. */
export function normalizeTheme(theme: string | null | undefined): ThemeMode {
  return theme === 'dark' ? 'dark' : 'light'
}
