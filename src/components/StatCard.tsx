import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  subtext?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
}

export function StatCard({ label, value, subtext, icon: Icon }: StatCardProps) {
  return (
    <article className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold text-text">{value}</p>
          {subtext && <p className="mt-1 text-xs text-text-muted">{subtext}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
          <Icon size={20} />
        </div>
      </div>
    </article>
  )
}
