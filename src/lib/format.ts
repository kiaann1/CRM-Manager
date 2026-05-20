import type { UserPreferences } from '../types'

export type RegionalFormatPrefs = Pick<UserPreferences, 'currency' | 'locale' | 'timezone'>

const DEFAULT_REGIONAL: RegionalFormatPrefs = {
  currency: 'USD',
  locale: 'en-US',
  timezone: 'UTC',
}

function mergeRegional(prefs?: Partial<RegionalFormatPrefs>): RegionalFormatPrefs {
  return { ...DEFAULT_REGIONAL, ...prefs }
}

export function formatCurrency(value: number, prefs?: Partial<RegionalFormatPrefs>): string {
  const p = mergeRegional(prefs)
  try {
    return new Intl.NumberFormat(p.locale, {
      style: 'currency',
      currency: p.currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }
}

export function formatDate(date: string, prefs?: Partial<RegionalFormatPrefs>): string {
  const p = mergeRegional(prefs)
  const d = new Date(date.includes('T') ? date : `${date}T12:00:00`)
  try {
    return new Intl.DateTimeFormat(p.locale, {
      timeZone: p.timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d)
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d)
  }
}

export function fullName(first: string, last: string): string {
  return `${first} ${last}`.trim()
}

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase()
  }
  return (parts[0]?.slice(0, 2) ?? '?').toUpperCase()
}

export const DEAL_STAGES = [
  { id: 'lead' as const, label: 'Lead', color: 'bg-slate-100 text-slate-700' },
  { id: 'qualified' as const, label: 'Qualified', color: 'bg-sky-100 text-sky-700' },
  { id: 'proposal' as const, label: 'Proposal', color: 'bg-violet-100 text-violet-700' },
  { id: 'negotiation' as const, label: 'Negotiation', color: 'bg-amber-100 text-amber-800' },
  { id: 'won' as const, label: 'Won', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'lost' as const, label: 'Lost', color: 'bg-rose-100 text-rose-700' },
]

export const PIPELINE_STAGES = DEAL_STAGES.filter(
  (s) => s.id !== 'won' && s.id !== 'lost',
)
