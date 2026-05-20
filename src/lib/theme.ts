import type { ThemeMode } from '../types'

/** Coerce legacy `system` (and unknown values) to light or dark only. */
export function normalizeTheme(theme: string | undefined): ThemeMode {
  return theme === 'dark' ? 'dark' : 'light'
}

/** Tailwind stage/badge classes from DB are light-oriented; append dark-mode counterparts. */
const BADGE_DARK: Record<string, string> = {
  'bg-slate-100 text-slate-700': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  'bg-sky-100 text-sky-700': 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  'bg-violet-100 text-violet-700': 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  'bg-amber-100 text-amber-800': 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  'bg-emerald-100 text-emerald-700': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-rose-100 text-rose-700': 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
}

export function badgeClass(classes: string): string {
  return BADGE_DARK[classes] ?? `${classes} dark:bg-slate-800 dark:text-slate-200`
}

export const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
}
