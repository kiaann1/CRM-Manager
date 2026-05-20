import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ChangeEventHandler } from 'react'

interface PasswordInputProps {
  label: string
  id?: string
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  autoComplete?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

export function PasswordInput({
  label,
  id: idProp,
  value,
  onChange,
  autoComplete,
  className = '',
  disabled,
  required,
}: PasswordInputProps) {
  const reactId = useId()
  const inputId = idProp ?? `${label.toLowerCase().replace(/\s+/g, '-')}-${reactId}`
  const [visible, setVisible] = useState(false)

  return (
    <label className={`block space-y-1.5 ${className}`.trim()} htmlFor={inputId}>
      <span className="text-sm font-medium text-text">{label}</span>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className="form-control w-full pr-11"
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
        />
        <button
          type="button"
          className="btn-icon absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 text-text-muted hover:text-text"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
    </label>
  )
}
