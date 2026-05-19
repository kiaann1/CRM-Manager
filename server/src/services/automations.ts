import { notifyIntegrationChannels } from '../lib/integrations/notify.js'
import { prisma } from '../lib/prisma.js'

type Trigger = { type: string; stage?: string; entity?: string }
type Action =
  | { type: 'create_task'; title: string }
  | { type: 'notify'; message: string }

export async function runDealStageAutomations(
  orgId: string,
  deal: {
    id: string
    title: string
    stageKey: string
    ownerId: string
    contactId: string | null
    companyId: string | null
  },
  previousStageKey: string,
) {
  if (deal.stageKey === previousStageKey) return

  const rules = await prisma.automationRule.findMany({
    where: { organizationId: orgId, enabled: true },
  })

  for (const rule of rules) {
    const trigger = rule.trigger as Trigger
    if (trigger.type !== 'deal_stage_changed') continue
    if (trigger.stage !== deal.stageKey) continue

    const actions = rule.actions as Action[]
    for (const action of actions) {
      if (action.type === 'create_task') {
        await prisma.task.create({
          data: {
            organizationId: orgId,
            title: action.title,
            description: `Auto-created by automation: ${rule.name}`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            priority: 'medium',
            status: 'todo',
            contactId: deal.contactId,
            dealId: deal.id,
            ownerId: deal.ownerId,
          },
        })
      }
      if (action.type === 'notify') {
        await prisma.notification.create({
          data: {
            userId: deal.ownerId,
            title: rule.name,
            body: action.message,
            read: false,
          },
        })
      }
    }
  }

  await notifyIntegrationChannels(
    orgId,
    `Deal *${deal.title}* moved to stage **${deal.stageKey}** (was ${previousStageKey}).`,
  )
}
