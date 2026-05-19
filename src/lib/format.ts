export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date + (date.includes('T') ? '' : 'T12:00:00')))
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
