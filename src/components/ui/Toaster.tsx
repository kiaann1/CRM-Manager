import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { registerModalOpen } from '../../lib/modalPresence'
import { lockDocumentScroll } from '../../lib/scrollLock'
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

  useEffect(() => {
    if (!confirm) return
    const releaseScroll = lockDocumentScroll()
    const releaseModal = registerModalOpen()
    return () => {
      releaseScroll()
      releaseModal()
    }
  }, [confirm])

  return (
    <>
      <div
        className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-[100] flex flex-col items-stretch gap-2 sm:left-auto sm:right-4 sm:max-w-sm sm:items-end"
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
          className="fixed inset-0 z-[110] flex min-h-0 items-center justify-center overflow-hidden overscroll-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => resolveConfirm(false)}
            aria-hidden
          />
          <div className="relative flex min-h-0 w-full max-w-[min(100vw-1.5rem,28rem)] max-h-[min(90dvh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
              <h2 id="confirm-title" className="text-lg font-semibold text-text">
                {confirm.title}
              </h2>
              {confirm.message && (
                <p className="mt-3 text-sm leading-relaxed text-text-muted">{confirm.message}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-border px-4 py-4 sm:px-6 sm:py-4">
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
