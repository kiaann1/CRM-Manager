import type { ConfirmOptions } from '../context/ToastContext'

/** Helper for delete confirmations */
export function deleteConfirm(
  askConfirm: (options: ConfirmOptions) => void,
  name: string,
  onConfirm: () => void,
) {
  askConfirm({
    title: `Delete ${name}?`,
    message: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    variant: 'danger',
    onConfirm,
  })
}
