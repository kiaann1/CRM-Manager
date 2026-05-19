import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

export function Textarea({ label, id, className = '', ...props }: TextareaProps) {
  const textareaId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className="block space-y-1.5" htmlFor={textareaId}>
      <span className="text-sm font-medium text-text">{label}</span>
      <textarea
        id={textareaId}
        rows={3}
        className={`form-control resize-y ${className}`}
        {...props}
      />
    </label>
  )
}
