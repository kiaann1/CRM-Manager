import type { CrmState } from '../types'
import { defaultState } from './defaults'
import { PIPE_DEFAULT, USER_SARAH } from './ids'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isLegacyState(raw: any): boolean {
  return raw && !raw.version && Array.isArray(raw.contacts)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateState(raw: any): CrmState {
  if (!raw || typeof raw !== 'object') return defaultState
  if (raw.version === 2) return raw as CrmState

  if (isLegacyState(raw)) {
    const base = structuredClone(defaultState)
    base.companies = (raw.companies ?? []).map((c: CrmState['companies'][0]) => ({
      ...c,
      parentId: c.parentId ?? null,
      ownerId: c.ownerId ?? USER_SARAH,
      territoryId: c.territoryId ?? null,
      healthScore: c.healthScore ?? 70,
      tagIds: c.tagIds ?? [],
    }))
    base.contacts = (raw.contacts ?? []).map((c: CrmState['contacts'][0]) => ({
      ...c,
      ownerId: c.ownerId ?? USER_SARAH,
      tagIds: c.tagIds ?? [],
      leadId: c.leadId ?? null,
    }))
    base.deals = (raw.deals ?? []).map((d: CrmState['deals'][0]) => ({
      ...d,
      pipelineId: d.pipelineId ?? PIPE_DEFAULT,
      ownerId: d.ownerId ?? USER_SARAH,
      tagIds: d.tagIds ?? [],
      slaDue: d.slaDue ?? null,
    }))
    base.tasks = (raw.tasks ?? []).map((t: CrmState['tasks'][0]) => ({
      ...t,
      ownerId: t.ownerId ?? USER_SARAH,
      parentId: t.parentId ?? null,
      dependsOn: t.dependsOn ?? [],
      recurring: t.recurring ?? 'none',
      estimateMinutes: t.estimateMinutes ?? 0,
      loggedMinutes: t.loggedMinutes ?? 0,
      sprintId: t.sprintId ?? null,
      goalId: t.goalId ?? null,
      checklist: t.checklist ?? [],
      tagIds: t.tagIds ?? [],
    }))
    return base
  }

  return { ...defaultState, ...raw, version: 2 }
}
