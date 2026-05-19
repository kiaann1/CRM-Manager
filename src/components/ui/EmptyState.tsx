import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-8 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon size={24} />
      </div>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
