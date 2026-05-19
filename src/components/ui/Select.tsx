import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
}

export function Select({ label, id, options, className = '', ...props }: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className="block space-y-1.5" htmlFor={selectId}>
      <span className="text-sm font-medium text-text">{label}</span>
      <select id={selectId} className={`form-control ${className}`} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
