import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Deal, DealStage } from '../../types'
import { useCrm } from '../../context/CrmContext'

const cellInput =
  'w-full min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none hover:border-border focus:border-brand-500 focus:bg-surface'

interface DealTableRowProps {
  deal: Deal
  companyName: string
  contactName: string
  onSave: (patch: Partial<Deal>) => void
  onDelete: () => void
  onOpen?: () => void
}

export function DealTableRow({
  deal,
  companyName,
  contactName,
  onSave,
  onDelete,
  onOpen,
}: DealTableRowProps) {
  const { pipelineStages } = useCrm()
  const stages = [...pipelineStages].sort((a, b) => a.order - b.order)
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

  return (
    <tr className="table-row-hover align-middle">
      <td className="px-2 py-1.5">
        <input
          className={`${cellInput} font-medium text-text`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const t = title.trim()
            if (t && t !== deal.title) onSave({ title: t })
            else setTitle(deal.title)
          }}
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="number"
          min={0}
          className={`${cellInput} w-24 font-semibold text-brand-600`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            const n = Number(value)
            if (!Number.isNaN(n) && n >= 0 && n !== deal.value) onSave({ value: n })
            else setValue(String(deal.value))
          }}
        />
      </td>
      <td className="px-2 py-1.5">
        <select
          className={cellInput}
          value={stage}
          onChange={(e) => {
            const next = e.target.value as DealStage
            setStage(next)
            if (next !== deal.stage) onSave({ stage: next })
          }}
        >
          {stages.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1.5">
        <input
          type="date"
          className={cellInput}
          value={expectedClose}
          onChange={(e) => setExpectedClose(e.target.value)}
          onBlur={() => {
            if (expectedClose !== deal.expectedClose) onSave({ expectedClose })
            else setExpectedClose(deal.expectedClose)
          }}
        />
      </td>
      <td className="px-2 py-1.5 text-sm text-text-muted">{contactName}</td>
      <td className="px-2 py-1.5 text-sm text-text-muted">{companyName}</td>
      <td className="px-2 py-1.5">
        <div className="flex gap-1">
          {onOpen && (
            <button
              type="button"
              className="rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
              onClick={onOpen}
            >
              Open
            </button>
          )}
          <button
            type="button"
            className="rounded p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
            aria-label="Delete deal"
            onClick={onDelete}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}
