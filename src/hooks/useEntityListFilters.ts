import { useCallback, useMemo, useState } from 'react'
import { useCrm } from '../context/CrmContext'
import { api } from '../lib/api/client'
import type { SavedView } from '../types'
import type { SavedFilter } from './useListFilters'

export type EntityListPage = 'contacts' | 'deals' | 'leads'

function toSavedFilter(view: SavedView): SavedFilter {
  return {
    id: view.id,
    name: view.name,
    query: view.filters.query ?? '',
    stage: view.filters.stage,
    minScore: view.filters.minScore,
  }
}

/** List filters with saved views persisted to the API (per org + user). */
export function useEntityListFilters(page: EntityListPage) {
  const { savedViews, refreshWorkspace } = useCrm()
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState('')
  const [minScore, setMinScore] = useState<number | ''>('')

  const saved = useMemo(
    () => savedViews.filter((v) => v.entityType === page).map(toSavedFilter),
    [savedViews, page],
  )

  const saveCurrent = useCallback(
    async (name: string) => {
      await api.createSavedView({
        entityType: page,
        name,
        filters: {
          query,
          ...(stage ? { stage } : {}),
          ...(minScore !== '' ? { minScore } : {}),
        },
      })
      await refreshWorkspace()
    },
    [page, query, stage, minScore, refreshWorkspace],
  )

  const apply = useCallback((f: SavedFilter) => {
    setQuery(f.query)
    setStage(f.stage ?? '')
    setMinScore(f.minScore ?? '')
  }, [])

  const remove = useCallback(
    async (id: string) => {
      await api.deleteSavedView(id)
      await refreshWorkspace()
    },
    [refreshWorkspace],
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
