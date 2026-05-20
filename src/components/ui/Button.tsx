import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-md shadow-brand-600/25 hover:from-brand-700 hover:to-violet-700',
  secondary:
    'border border-border bg-surface text-text hover:bg-surface-muted dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  ghost:
    'text-text-muted hover:bg-surface-muted hover:text-text dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
