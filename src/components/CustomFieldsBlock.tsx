import { useCrm } from '../context/CrmContext'
import { Input } from './ui/Input'
import { Select } from './ui/Select'

interface CustomFieldsBlockProps {
  entityType: string
  entityId: string
}

export function CustomFieldsBlock({ entityType, entityId }: CustomFieldsBlockProps) {
  const crm = useCrm()
  const defs = crm.customFieldDefs.filter((d) => d.entityType === entityType)
  const values = crm.customFieldValues[entityType]?.[entityId] ?? {}

  if (defs.length === 0) return null

  return (
    <section className="mb-4 rounded-lg border border-border p-3 dark:border-slate-700">
      <p className="mb-2 text-xs font-semibold uppercase text-text-muted">Custom fields</p>
      <div className="space-y-3">
        {defs.map((def) => {
          const raw = values[def.id]
          if (def.type === 'dropdown' && def.options.length > 0) {
            return (
              <Select
                key={def.id}
                label={def.label}
                value={String(raw ?? '')}
                onChange={(e) =>
                  crm.setCustomField(entityType, entityId, def.id, e.target.value)
                }
                options={[
                  { value: '', label: '—' },
                  ...def.options.map((o) => ({ value: o, label: o })),
                ]}
              />
            )
          }
          if (def.type === 'number') {
            return (
              <Input
                key={def.id}
                label={def.label}
                type="number"
                value={raw != null ? String(raw) : ''}
                onChange={(e) =>
                  crm.setCustomField(
                    entityType,
                    entityId,
                    def.id,
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            )
          }
          return (
            <Input
              key={def.id}
              label={def.label}
              value={raw != null ? String(raw) : ''}
              onChange={(e) =>
                crm.setCustomField(entityType, entityId, def.id, e.target.value)
              }
            />
          )
        })}
      </div>
    </section>
  )
}
