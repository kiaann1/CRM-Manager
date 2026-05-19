import type { CrmState, Deal, DealStage } from '../types'

export function stageProbability(crm: CrmState, stage: DealStage): number {
  return crm.pipelineStages.find((s) => s.key === stage)?.probability ?? 0
}

export function weightedPipelineValue(crm: CrmState): number {
  return crm.deals
    .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
    .reduce((sum, d) => sum + d.value * (stageProbability(crm, d.stage) / 100), 0)
}

export function funnelByStage(crm: CrmState): { stage: DealStage; label: string; count: number; value: number; color: string }[] {
  const stages = [...crm.pipelineStages].sort((a, b) => a.order - b.order)
  return stages.map((s) => {
    const inStage = crm.deals.filter((d) => d.stage === s.key)
    return {
      stage: s.key,
      label: s.label,
      count: inStage.length,
      value: inStage.reduce((n, d) => n + d.value, 0),
      color: s.color,
    }
  })
}

export function dealVelocityDays(deals: Deal[]): number | null {
  const won = deals.filter((d) => d.stage === 'won')
  if (!won.length) return null
  const avgMs =
    won.reduce((s, d) => s + Date.now() - new Date(d.createdAt).getTime(), 0) / won.length
  return Math.round(avgMs / (1000 * 60 * 60 * 24))
}
