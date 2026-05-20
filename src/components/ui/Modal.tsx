import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { lockDocumentScroll } from '../../lib/scrollLock'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  /** Wider shell for dense forms (e.g. product editor). */
  panelClassName?: string
}

export function Modal({ open, onClose, title, children, footer, panelClassName = '' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const releaseScroll = lockDocumentScroll()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      releaseScroll()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-0 items-end justify-center overflow-hidden overscroll-none px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative flex min-h-0 max-h-[min(92dvh,calc(100dvh-1rem))] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl ${panelClassName}`.trim()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="min-w-0 flex-1 text-lg font-semibold text-text">{title}</h2>
          <Button variant="ghost" className="!p-2 shrink-0" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 sm:py-4">
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border px-4 py-3 sm:px-6 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
