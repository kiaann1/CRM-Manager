import { useEffect, useSyncExternalStore } from 'react'

let openCount = 0
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return openCount
}

function notify() {
  for (const cb of listeners) cb()
}

/** Call when a modal opens; returns cleanup when it closes. */
export function registerModalOpen(): () => void {
  openCount++
  notify()
  return () => {
    openCount = Math.max(0, openCount - 1)
    notify()
  }
}

/** True while any `Modal` (or other caller of `registerModalOpen`) is open. */
export function useAnyModalOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** Hook for modal components. */
export function useModalPresence(open: boolean) {
  useEffect(() => {
    if (!open) return
    return registerModalOpen()
  }, [open])
}
