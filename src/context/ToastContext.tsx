import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
}

interface ToastContextValue {
  toasts: Toast[]
  confirm: ConfirmOptions | null
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  dismiss: (id: string) => void
  askConfirm: (options: ConfirmOptions) => void
  resolveConfirm: (confirmed: boolean) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirm, setConfirm] = useState<ConfirmOptions | null>(null)
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id)
    if (t) clearTimeout(t)
    timers.current.delete(id)
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, variant }])
      const timer = setTimeout(() => dismiss(id), TOAST_MS)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  const success = useCallback((message: string) => push(message, 'success'), [push])
  const error = useCallback((message: string) => push(message, 'error'), [push])
  const info = useCallback((message: string) => push(message, 'info'), [push])

  const askConfirm = useCallback((options: ConfirmOptions) => {
    setConfirm(options)
  }, [])

  const resolveConfirm = useCallback(
    (confirmed: boolean) => {
      if (confirmed && confirm) confirm.onConfirm()
      setConfirm(null)
    },
    [confirm],
  )

  const value = useMemo(
    () => ({
      toasts,
      confirm,
      success,
      error,
      info,
      dismiss,
      askConfirm,
      resolveConfirm,
    }),
    [toasts, confirm, success, error, info, dismiss, askConfirm, resolveConfirm],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
