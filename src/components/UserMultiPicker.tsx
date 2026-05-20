import { useCrm } from '../context/CrmContext'

interface UserMultiPickerProps {
  value: string[]
  onChange: (userIds: string[]) => void
  label?: string
}

export function UserMultiPicker({
  value,
  onChange,
  label = 'Assigned to',
}: UserMultiPickerProps) {
  const { users } = useCrm()

  const toggle = (userId: string) => {
    if (value.includes(userId)) {
      if (value.length <= 1) return
      onChange(value.filter((id) => id !== userId))
    } else {
      onChange([...value, userId])
    }
  }

  if (users.length === 0) {
    return <p className="text-xs text-text-muted">No team members in this workspace.</p>
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-text">{label}</span>
      <div className="flex flex-wrap gap-2">
        {users.map((u) => {
          const active = value.includes(u.id)
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-border bg-surface-muted text-text-muted hover:border-brand-400 hover:text-text'
              }`}
            >
              {u.name}
            </button>
          )
        })}
      </div>
      <p className="mt-1.5 text-xs text-text-muted">
        Select one or more people. At least one assignee is required.
      </p>
    </div>
  )
}
