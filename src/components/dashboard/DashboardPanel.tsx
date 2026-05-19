import type { ReactNode } from 'react'

interface DashboardPanelProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className = '',
  noPadding,
}: DashboardPanelProps) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700/80 dark:bg-slate-900 dark:ring-white/5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/80 px-5 py-4 dark:border-slate-700/80">
        <div>
          <h2 className="font-semibold tracking-tight text-text">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </section>
  )
}
