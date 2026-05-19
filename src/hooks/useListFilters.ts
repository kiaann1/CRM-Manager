import { useCallback, useState } from 'react'

export interface SavedFilter {
  id: string
  name: string
  query: string
  stage?: string
  minScore?: number
}

const storageKey = (page: string) => `crm-saved-filters-${page}`

function loadSaved(page: string): SavedFilter[] {
  try {
    const raw = localStorage.getItem(storageKey(page))
    return raw ? (JSON.parse(raw) as SavedFilter[]) : []
  } catch {
    return []
  }
}

export function useListFilters(page: string) {
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState('')
  const [minScore, setMinScore] = useState<number | ''>('')
  const [saved, setSaved] = useState<SavedFilter[]>(() => loadSaved(page))

  const persist = useCallback(
    (list: SavedFilter[]) => {
      localStorage.setItem(storageKey(page), JSON.stringify(list))
      setSaved(list)
    },
    [page],
  )

  const saveCurrent = useCallback(
    (name: string) => {
      const entry: SavedFilter = {
        id: crypto.randomUUID(),
        name,
        query,
        stage: stage || undefined,
        minScore: minScore === '' ? undefined : minScore,
      }
      persist([...saved, entry])
    },
    [query, stage, minScore, saved, persist],
  )

  const apply = useCallback((f: SavedFilter) => {
    setQuery(f.query)
    setStage(f.stage ?? '')
    setMinScore(f.minScore ?? '')
  }, [])

  const remove = useCallback(
    (id: string) => {
      persist(saved.filter((s) => s.id !== id))
    },
    [saved, persist],
  )

  return {
    query,
    setQuery,
    stage,
    setStage,
    minScore,
    setMinScore,
    saved,
    saveCurrent,
    apply,
    remove,
  }
}
