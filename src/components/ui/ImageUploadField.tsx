import { ImageIcon, Upload, X } from 'lucide-react'
import { useId, useRef } from 'react'
import { Button } from './Button'

const MAX_BYTES = 2 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

interface ImageUploadFieldProps {
  label?: string
  value: string
  onChange: (url: string) => void
  onError?: (message: string) => void
  hint?: string
}

export function ImageUploadField({
  label = 'Product image',
  value,
  onChange,
  onError,
  hint = 'Upload a photo for now. A shared media library is planned for a later release.',
}: ImageUploadFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const pickFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError?.('Please choose an image file (JPEG, PNG, WebP, or GIF).')
      return
    }
    if (file.size > MAX_BYTES) {
      onError?.('Image must be 2 MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result)
    }
    reader.onerror = () => onError?.('Could not read that file.')
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-text">{label}</span>
      {value ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-muted">
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
              <Upload size={16} className="mr-1 inline" />
              Replace
            </Button>
            <Button type="button" variant="ghost" className="text-rose-600" onClick={() => onChange('')}>
              <X size={16} className="mr-1 inline" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-muted/40 px-4 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/30"
        >
          <ImageIcon size={28} className="text-text-muted" />
          <span className="text-sm font-medium text-text">Choose image</span>
          <span className="text-xs text-text-muted">JPEG, PNG, WebP, GIF · max 2 MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void pickFile(file)
          e.target.value = ''
        }}
      />
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
