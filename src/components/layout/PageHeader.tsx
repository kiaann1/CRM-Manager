import type { ReactNode } from 'react'
import type { PageAccent } from './pageAccent'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  accent?: PageAccent
}

export function PageHeader({ title, description, actions, accent = 'brand' }: PageHeaderProps) {
  return (
    <header className={`page-hero page-hero--${accent}`}>
      <div className="page-hero__glow" aria-hidden />
      <div className="page-hero__inner">
        <div className="min-w-0 flex-1 basis-full lg:basis-auto">
          <h1 className="page-hero__title">{title}</h1>
          {description && <p className="page-hero__desc">{description}</p>}
        </div>
        {actions && (
          <div className="page-hero__actions w-full min-w-0 shrink-0 sm:w-auto">{actions}</div>
        )}
      </div>
    </header>
  )
}
