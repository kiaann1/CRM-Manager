import type { LucideIcon } from 'lucide-react'

type Accent = 'indigo' | 'violet' | 'emerald' | 'sky' | 'amber'

interface StatCardProps {
  label: string
  value: string
  subtext?: string
  icon: LucideIcon
  accent?: Accent
}

const accentStyles: Record<
  Accent,
  { card: string; icon: string; value: string }
> = {
  indigo: {
    card: 'border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-white dark:border-indigo-900/50 dark:from-indigo-950/30 dark:to-slate-900',
    icon: 'bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
    value: 'text-indigo-950 dark:text-indigo-50',
  },
  violet: {
    card: 'border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-white dark:border-violet-900/50 dark:from-violet-950/30 dark:to-slate-900',
    icon: 'bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300',
    value: 'text-violet-950 dark:text-violet-50',
  },
  emerald: {
    card: 'border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-slate-900',
    icon: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    value: 'text-emerald-950 dark:text-emerald-50',
  },
  sky: {
    card: 'border-sky-200/60 bg-gradient-to-br from-sky-50/80 to-white dark:border-sky-900/50 dark:from-sky-950/30 dark:to-slate-900',
    icon: 'bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300',
    value: 'text-sky-950 dark:text-sky-50',
  },
  amber: {
    card: 'border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-white dark:border-amber-900/50 dark:from-amber-950/30 dark:to-slate-900',
    icon: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    value: 'text-amber-950 dark:text-amber-50',
  },
}

export function StatCard({ label, value, subtext, icon: Icon, accent = 'indigo' }: StatCardProps) {
  const styles = accentStyles[accent]

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${styles.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
          <p className={`mt-2 truncate text-2xl font-bold tracking-tight sm:text-[1.65rem] ${styles.value}`}>
            {value}
          </p>
          {subtext && <p className="mt-1.5 text-xs font-medium text-text-muted">{subtext}</p>}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${styles.icon}`}
        >
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>
    </article>
  )
}
