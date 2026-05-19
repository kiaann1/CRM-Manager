import type { AutomationRule, CrmState, Deal, Notification, Task } from '../types'
import { createId } from './ids'

export function runAutomationsForDealStage(
  prev: CrmState,
  deal: Deal,
  previousStage: string,
): Partial<CrmState> {
  const patches: Partial<CrmState> = {}
  const newTasks: Task[] = []
  const newNotifications: Notification[] = []

  for (const rule of prev.automations.filter((r) => r.enabled)) {
    if (rule.trigger.type !== 'deal_stage_changed') continue
    if (rule.trigger.stage !== deal.stage) continue
    if (previousStage === deal.stage) continue

    for (const action of rule.actions) {
      if (action.type === 'create_task') {
        newTasks.push({
          id: createId('tk'),
          title: action.title,
          description: `Auto-created by: ${rule.name}`,
          dueDate: new Date().toISOString().slice(0, 10),
          priority: 'medium',
          status: 'todo',
          contactId: deal.contactId,
          dealId: deal.id,
          ownerId: deal.ownerId,
          parentId: null,
          dependsOn: [],
          recurring: 'none',
          estimateMinutes: 30,
          loggedMinutes: 0,
          sprintId: null,
          goalId: null,
          checklist: [],
          tagIds: [],
          createdAt: new Date().toISOString(),
        })
      }
      if (action.type === 'notify') {
        newNotifications.push({
          id: createId('n'),
          userId: deal.ownerId,
          title: rule.name,
          body: action.message,
          read: false,
          createdAt: new Date().toISOString(),
        })
      }
    }
  }

  if (newTasks.length) patches.tasks = [...prev.tasks, ...newTasks]
  if (newNotifications.length)
    patches.notifications = [...prev.notifications, ...newNotifications]

  return patches
}

export function runAutomationsOnCreate(
  state: CrmState,
  entity: string,
): Partial<CrmState> {
  const newNotifications: Notification[] = []
  for (const rule of state.automations.filter((r) => r.enabled)) {
    if (rule.trigger.type !== 'record_created') continue
    if (rule.trigger.entity !== entity) continue
    for (const action of rule.actions) {
      if (action.type === 'notify') {
        newNotifications.push({
          id: createId('n'),
          userId: state.session?.userId ?? state.users[0]?.id ?? '',
          title: rule.name,
          body: action.message,
          read: false,
          createdAt: new Date().toISOString(),
        })
      }
    }
  }
  if (!newNotifications.length) return {}
  return { notifications: [...state.notifications, ...newNotifications] }
}

export function describeRule(rule: AutomationRule): string {
  const t = rule.trigger
  const triggerLabel =
    t.type === 'deal_stage_changed'
      ? `Deal moves to ${t.stage}`
      : t.type === 'record_created'
        ? `New ${t.entity} created`
        : t.type === 'field_changed'
          ? `${t.entity}.${t.field} changes`
          : `Scheduled (${t.cron})`
  return triggerLabel
}
