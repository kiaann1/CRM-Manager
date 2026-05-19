import type { CrmState } from '../types'

export function getNextBestActions(state: CrmState, userId: string): string[] {
  const actions: string[] = []
  const overdueTasks = state.tasks.filter(
    (t) =>
      t.ownerId === userId &&
      t.status !== 'done' &&
      new Date(t.dueDate) < new Date(new Date().toDateString()),
  )
  if (overdueTasks.length)
    actions.push(`Complete ${overdueTasks.length} overdue task(s).`)

  const staleDeals = state.deals.filter(
    (d) =>
      d.ownerId === userId &&
      d.stage !== 'won' &&
      d.stage !== 'lost' &&
      new Date(d.expectedClose) < new Date(),
  )
  if (staleDeals.length)
    actions.push(`Update close dates on ${staleDeals.length} past-due deal(s).`)

  const hotLeads = state.leads.filter((l) => l.score >= 70 && l.stage !== 'converted')
  if (hotLeads.length)
    actions.push(`Follow up with ${hotLeads.length} high-score lead(s).`)

  const pendingApprovals = state.approvals.filter(
    (a) => a.approverId === userId && a.status === 'pending',
  )
  if (pendingApprovals.length)
    actions.push(`Review ${pendingApprovals.length} pending approval(s).`)

  if (!actions.length) actions.push('Pipeline looks healthy — schedule proactive outreach.')
  return actions
}

export function summarizeRecord(
  type: string,
  title: string,
  activityCount: number,
  openTasks: number,
): string {
  return `${title} (${type}): ${activityCount} recent activities, ${openTasks} open task(s). Focus on the next committed milestone.`
}
