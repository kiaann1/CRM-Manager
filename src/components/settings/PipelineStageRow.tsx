import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import type { PipelineStageConfig } from '../../types'
import { badgeClass } from '../../lib/theme'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function PipelineStageRow({
  stage,
  onSave,
}: {
  stage: PipelineStageConfig
  onSave: (
    id: string,
    data: Partial<Pick<PipelineStageConfig, 'label' | 'probability' | 'color'>>,
  ) => void
}) {
  const toast = useToast()
  const [label, setLabel] = useState(stage.label)
  const [probability, setProbability] = useState(stage.probability)

  const save = () => {
    onSave(stage.id, { label: label.trim() || stage.label, probability })
    toast.success(`Updated ${stage.key}`)
  }

  const dirty = label !== stage.label || probability !== stage.probability

  return (
    <li className="flex flex-wrap items-end gap-3 list-item p-3">
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${badgeClass(stage.color)}`}>{stage.key}</span>
      <Input
        label="Label"
        className="min-w-[8rem] flex-1"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <Input
        label="Win %"
        type="number"
        min={0}
        max={100}
        className="w-24"
        value={probability}
        onChange={(e) => setProbability(Number(e.target.value) || 0)}
      />
      <Button variant="secondary" disabled={!dirty} onClick={save}>
        Save
      </Button>
    </li>
  )
}
