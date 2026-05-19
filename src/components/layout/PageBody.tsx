import type { ReactNode } from 'react'

interface PageBodyProps {
  children: ReactNode
  className?: string
}

export function PageBody({ children, className = '' }: PageBodyProps) {
  return <div className={`page-shell ${className}`.trim()}>{children}</div>
}
