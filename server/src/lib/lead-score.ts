export function computeLeadScore(lead: {
  email: string
  phone: string
  stage: string
  utmSource: string
}): number {
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
      return 100
    case 'disqualified':
      return 0
    default:
      break
  }
  return Math.min(100, score)
}
