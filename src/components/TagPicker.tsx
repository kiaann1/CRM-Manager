import { useCrm } from '../context/CrmContext'

interface TagPickerProps {
  value: string[]
  onChange: (tagIds: string[]) => void
  label?: string
}

export function TagPicker({ value, onChange, label = 'Tags' }: TagPickerProps) {
  const { tags } = useCrm()

  const toggle = (tagId: string) => {
    if (value.includes(tagId)) onChange(value.filter((id) => id !== tagId))
    else onChange([...value, tagId])
  }

  if (tags.length === 0) {
    return <p className="text-xs text-text-muted">No tags — create tags in Settings.</p>
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-text">{label}</span>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => {
          const active = value.includes(t.id)
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                active ? 'ring-2 ring-brand-500 ring-offset-1' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: active ? t.color : `${t.color}33`,
                color: active ? '#fff' : t.color,
              }}
            >
              {t.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
