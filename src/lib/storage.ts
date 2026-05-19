import type { CrmState } from '../types'
import { defaultState } from './defaults'
import { migrateState } from './migrate'

const STORAGE_KEY = 'crm-manager-data'

export { defaultState } from './defaults'
export { createId } from './ids'

export function loadState(): CrmState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    return migrateState(JSON.parse(raw))
  } catch {
    return defaultState
  }
}

export function saveState(state: CrmState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
