import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { Button } from './Button'

const variantStyles = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
  error:
    'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100',
  info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100',
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

export function Toaster() {
  const { toasts, dismiss, confirm, resolveConfirm } = useToast()

  return (
    <>
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.variant]
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${variantStyles[toast.variant]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>

      {confirm && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => resolveConfirm(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h2 id="confirm-title" className="text-lg font-semibold text-text">
              {confirm.title}
            </h2>
            {confirm.message && (
              <p className="mt-2 text-sm text-text-muted">{confirm.message}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => resolveConfirm(false)}>
                {confirm.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                variant={confirm.variant === 'danger' ? 'danger' : 'primary'}
                onClick={() => resolveConfirm(true)}
              >
                {confirm.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
