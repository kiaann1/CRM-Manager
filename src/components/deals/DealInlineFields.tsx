import { useEffect, useState } from 'react'
import type { Deal, DealStage } from '../../types'
import { DEAL_STAGES } from '../../lib/format'

const fieldClass =
  'w-full min-w-0 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm outline-none transition hover:border-border focus:border-brand-500 focus:bg-surface focus:ring-1 focus:ring-brand-500/20'

interface DealInlineFieldsProps {
  deal: Deal
  compact?: boolean
  onSave: (patch: Partial<Deal>) => void
}

export function DealInlineFields({ deal, compact, onSave }: DealInlineFieldsProps) {
  const [title, setTitle] = useState(deal.title)
  const [value, setValue] = useState(String(deal.value))
  const [stage, setStage] = useState(deal.stage)
  const [expectedClose, setExpectedClose] = useState(deal.expectedClose)

  useEffect(() => {
    setTitle(deal.title)
    setValue(String(deal.value))
    setStage(deal.stage)
    setExpectedClose(deal.expectedClose)
  }, [deal.id, deal.title, deal.value, deal.stage, deal.expectedClose])

  const commitTitle = () => {
    const t = title.trim()
    if (t && t !== deal.title) onSave({ title: t })
    else setTitle(deal.title)
  }

  const commitValue = () => {
    const n = Number(value)
    if (!Number.isNaN(n) && n >= 0 && n !== deal.value) onSave({ value: n })
    else setValue(String(deal.value))
  }

  const commitStage = (next: DealStage) => {
    setStage(next)
    if (next !== deal.stage) onSave({ stage: next })
  }

  const commitClose = () => {
    if (expectedClose && expectedClose !== deal.expectedClose) onSave({ expectedClose })
    else setExpectedClose(deal.expectedClose)
  }

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <input
        className={`${fieldClass} font-semibold text-text`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        aria-label="Deal title"
      />
      <div className={compact ? 'grid grid-cols-1 gap-1' : 'grid grid-cols-2 gap-2'}>
        <input
          type="number"
          min={0}
          className={`${fieldClass} font-medium text-brand-600`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commitValue}
          aria-label="Deal value"
        />
        <input
          type="date"
          className={`${fieldClass} text-xs text-text-muted`}
          value={expectedClose}
          onChange={(e) => setExpectedClose(e.target.value)}
          onBlur={commitClose}
          aria-label="Expected close"
        />
      </div>
      <select
        className={`${fieldClass} text-xs`}
        value={stage}
        onChange={(e) => commitStage(e.target.value as DealStage)}
        aria-label="Stage"
      >
        {DEAL_STAGES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}
