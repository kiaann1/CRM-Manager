import type { ReactNode } from 'react'
import { PageHeader } from './PageHeader'
import type { PageAccent } from './pageAccent'

export type { PageAccent } from './pageAccent'

interface PageFrameProps {
  title: string
  description?: string
  actions?: ReactNode
  accent?: PageAccent
  toolbar?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function PageFrame({
  title,
  description,
  actions,
  accent = 'brand',
  toolbar,
  children,
  className = '',
  bodyClassName = '',
}: PageFrameProps) {
  return (
    <div className={`page-frame page-frame--${accent} ${className}`.trim()}>
      <PageHeader title={title} description={description} actions={actions} accent={accent} />
      {toolbar && <div className="page-toolbar">{toolbar}</div>}
      <div className={`page-shell ${bodyClassName}`.trim()}>{children}</div>
    </div>
  )
}
