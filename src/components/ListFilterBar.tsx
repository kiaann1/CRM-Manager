import { Bookmark, Filter } from 'lucide-react'
import { useState } from 'react'
import type { SavedFilter } from '../hooks/useListFilters'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'

interface ListFilterBarProps {
  query: string
  onQueryChange: (q: string) => void
  stage?: string
  onStageChange?: (s: string) => void
  stageOptions?: { value: string; label: string }[]
  minScore?: number | ''
  onMinScoreChange?: (n: number | '') => void
  saved: SavedFilter[]
  onSave: (name: string) => void | Promise<void>
  onApply: (f: SavedFilter) => void
  onRemove: (id: string) => void | Promise<void>
}

export function ListFilterBar({
  query,
  onQueryChange,
  stage,
  onStageChange,
  stageOptions,
  minScore,
  onMinScoreChange,
  saved,
  onSave,
  onApply,
  onRemove,
}: ListFilterBarProps) {
  const [saveName, setSaveName] = useState('')

  return (
    <div className="filter-bar">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <Filter size={16} />
        Filters & saved views
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Search"
          className="min-w-0 w-full flex-1 sm:min-w-[12rem]"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search…"
        />
        {stageOptions && onStageChange && (
          <Select
            label="Stage"
            className="w-full min-w-0 sm:w-40"
            value={stage ?? ''}
            onChange={(e) => onStageChange(e.target.value)}
            options={[{ value: '', label: 'All stages' }, ...stageOptions]}
          />
        )}
        {onMinScoreChange && (
          <Input
            label="Min score"
            type="number"
            className="w-28"
            min={0}
            max={100}
            value={minScore === '' ? '' : minScore}
            onChange={(e) =>
              onMinScoreChange(e.target.value === '' ? '' : Number(e.target.value))
            }
          />
        )}
      </div>
      <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3 dark:border-slate-700">
        <Input
          label="Save view as"
          className="max-w-xs flex-1"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="e.g. Hot enterprise"
        />
        <Button
          variant="secondary"
          className="self-end"
          onClick={() => {
            if (!saveName.trim()) return
            void Promise.resolve(onSave(saveName.trim())).then(() => setSaveName(''))
          }}
        >
          <Bookmark size={14} /> Save
        </Button>
      </div>
      {saved.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {saved.map((f) => (
            <span
              key={f.id}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2 py-1 text-xs"
            >
              <button type="button" className="font-medium hover:text-brand-600" onClick={() => onApply(f)}>
                {f.name}
              </button>
              <button
                type="button"
                className="text-text-muted hover:text-rose-600"
                onClick={() => void onRemove(f.id)}
                aria-label={`Remove ${f.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
