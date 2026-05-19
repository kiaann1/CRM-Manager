import type { Lead } from '../types'

export function computeLeadScore(lead: Pick<Lead, 'email' | 'phone' | 'stage' | 'utmSource'>): number {
  let score = 20
  if (lead.email) score += 15
  if (lead.phone) score += 10
  if (lead.utmSource && lead.utmSource !== 'direct') score += 15
  switch (lead.stage) {
    case 'contacted':
      score += 10
      break
    case 'qualified':
      score += 25
      break
    case 'converted':
      score = 100
      break
    case 'disqualified':
      score = 0
      break
    default:
      break
  }
  return Math.min(100, score)
}
