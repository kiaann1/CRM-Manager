import { prisma } from '../lib/prisma.js'
import { syncTaskAssignees } from './taskAssignees.js'

/**
 * Idempotent demo content for orgs missing key entities (new registrations, partial seeds).
 */
export async function ensureOrgStarterContent(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      teams: { take: 1 },
      memberships: { take: 1, include: { user: true } },
    },
  })
  if (!org?.teams[0] || !org.memberships[0]?.user) return

  const teamId = org.teams[0].id
  const userId = org.memberships[0].user.id

  const [
    goalCount,
    sprintCount,
    calendarCount,
    formCount,
    sequenceCount,
    boardCount,
    taskCount,
    campaignCount,
    activityCount,
  ] = await Promise.all([
    prisma.goal.count({ where: { organizationId } }),
    prisma.sprint.count({ where: { organizationId } }),
    prisma.calendarEvent.count({ where: { organizationId } }),
    prisma.marketingForm.count({ where: { organizationId } }),
    prisma.emailSequence.count({ where: { organizationId } }),
    prisma.board.count({ where: { organizationId } }),
    prisma.task.count({ where: { organizationId } }),
    prisma.campaign.count({ where: { organizationId } }),
    prisma.activity.count({ where: { organizationId } }),
  ])

  const company = await prisma.company.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
  })
  const contact = company
    ? await prisma.contact.findFirst({
        where: { organizationId, companyId: company.id },
      })
    : null
  const deal = await prisma.deal.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  })

  const now = new Date()
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
  const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
  const sprintEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  if (goalCount === 0) {
    await prisma.goal.create({
      data: {
        organizationId,
        title: 'Q2 new business revenue',
        target: 250_000,
        current: 48_000,
        quarter: 'Q2 2026',
        ownerId: userId,
      },
    })
  }

  let sprintId: string | null = null
  if (sprintCount === 0) {
    const sprint = await prisma.sprint.create({
      data: {
        organizationId,
        teamId,
        name: 'Sprint 24 — Pipeline push',
        start: now,
        end: sprintEnd,
      },
    })
    sprintId = sprint.id
  } else {
    const existing = await prisma.sprint.findFirst({ where: { organizationId } })
    sprintId = existing?.id ?? null
  }

  if (calendarCount === 0) {
    await prisma.calendarEvent.createMany({
      data: [
        {
          organizationId,
          title: deal ? `${deal.title} — discovery call` : 'Weekly pipeline review',
          start: inTwoDays,
          end: new Date(inTwoDays.getTime() + 45 * 60 * 1000),
          userId,
          recordType: deal ? 'deal' : null,
          recordId: deal?.id ?? null,
          externalSync: 'none',
        },
        {
          organizationId,
          title: company ? `Check-in: ${company.name}` : 'Team standup',
          start: inFiveDays,
          end: new Date(inFiveDays.getTime() + 30 * 60 * 1000),
          userId,
          recordType: company ? 'company' : null,
          recordId: company?.id ?? null,
          externalSync: 'none',
        },
      ],
    })
  }

  if (formCount === 0) {
    await prisma.marketingForm.create({
      data: {
        organizationId,
        name: 'Demo request',
        fields: [
          { id: 'email', label: 'Work email', type: 'email' },
          { id: 'company', label: 'Company', type: 'text' },
          { id: 'size', label: 'Team size', type: 'text' },
        ],
        submissions: [
          {
            id: 'sub-demo-1',
            data: {
              email: 'prospect@example.com',
              company: 'Example Co',
              size: '11-50',
            },
            at: now.toISOString(),
          },
        ],
      },
    })
  }

  if (sequenceCount === 0) {
    await prisma.emailSequence.create({
      data: {
        organizationId,
        name: 'New lead nurture',
        enabled: true,
        steps: [
          {
            delayDays: 0,
            subject: 'Thanks for your interest',
            body: 'Hi — here is a quick overview of how teams use CRM Manager.',
          },
          {
            delayDays: 3,
            subject: 'Book a 15-minute demo',
            body: 'Would a short call this week work? Reply with your availability.',
          },
        ],
      },
    })
  }

  if (campaignCount === 0) {
    await prisma.campaign.create({
      data: {
        organizationId,
        name: 'Website inbound',
        utmSource: 'website',
        utmMedium: 'organic',
        budget: 0,
      },
    })
  }

  if (boardCount === 0) {
    const board = await prisma.board.create({
      data: {
        organizationId,
        name: 'Getting started',
        isPrivate: false,
        columns: {
          create: [
            { title: 'To do', order: 0 },
            { title: 'In progress', order: 1 },
            { title: 'Done', order: 2 },
          ],
        },
      },
      include: { columns: true },
    })
    const todo = board.columns.find((c) => c.order === 0)
    if (todo) {
      await prisma.boardItem.create({
        data: {
          boardId: board.id,
          columnId: todo.id,
          title: 'Invite your team from Settings',
          ownerId: userId,
          order: 0,
          recordType: null,
          recordId: null,
          dueDate: inFiveDays,
        },
      })
    }
  }

  if (taskCount === 0) {
    await prisma.task.createMany({
      data: [
        {
          organizationId,
          title: 'Review open pipeline',
          description: 'Update deal stages before the weekly sync.',
          dueDate: inTwoDays,
          priority: 'high',
          status: 'todo',
          ownerId: userId,
          dealId: deal?.id ?? null,
          contactId: contact?.id ?? null,
          sprintId,
        },
        {
          organizationId,
          title: 'Connect Slack in Integrations',
          description: 'Get deal stage notifications in your team channel.',
          dueDate: inFiveDays,
          priority: 'medium',
          status: 'todo',
          ownerId: userId,
          dealId: null,
          contactId: null,
          sprintId,
        },
      ],
    })
    const starterTasks = await prisma.task.findMany({
      where: { organizationId },
      select: { id: true, ownerId: true },
    })
    for (const t of starterTasks) {
      await syncTaskAssignees(t.id, organizationId, [t.ownerId]).catch(() => undefined)
    }
  }

  if (activityCount === 0 && deal) {
    await prisma.activity.create({
      data: {
        organizationId,
        type: 'note',
        subject: 'Kickoff',
        body: 'Initial discovery completed — pricing discussion next.',
        recordType: 'deal',
        recordId: deal.id,
        userId,
      },
    })
  }

  if (company) {
    const surveyCount = await prisma.survey.count({
      where: { organizationId, companyId: company.id },
    })
    if (surveyCount === 0) {
      await prisma.survey.create({
        data: {
          organizationId,
          companyId: company.id,
          score: 9,
          feedback: 'Responsive team and clear onboarding.',
        },
      })
    }
  }

  if (deal) {
    const approvalCount = await prisma.approval.count({
      where: { organizationId, dealId: deal.id, status: 'pending' },
    })
    if (approvalCount === 0) {
      const secondMember = await prisma.membership.findFirst({
        where: { organizationId, userId: { not: userId } },
        include: { user: true },
      })
      await prisma.approval.create({
        data: {
          organizationId,
          dealId: deal.id,
          title: 'Discount approval — renewal',
          status: 'pending',
          requesterId: userId,
          approverId: secondMember?.userId ?? userId,
        },
      })
    }
  }

  const orgTaskIds = (
    await prisma.task.findMany({ where: { organizationId }, select: { id: true } })
  ).map((t) => t.id)
  if (orgTaskIds.length > 0) {
    const timeEntryCount = await prisma.timeEntry.count({
      where: { taskId: { in: orgTaskIds } },
    })
    if (timeEntryCount === 0) {
      const task = await prisma.task.findFirst({ where: { organizationId, ownerId: userId } })
      if (task) {
        await prisma.timeEntry.create({
          data: {
            taskId: task.id,
            userId,
            minutes: 45,
            date: now,
            note: 'Pipeline review',
          },
        })
      }
    }
  }

  const automationCount = await prisma.automationRule.count({ where: { organizationId } })
  if (automationCount === 0) {
    await prisma.automationRule.createMany({
      data: [
        {
          organizationId,
          name: 'Proposal → follow-up task',
          enabled: true,
          trigger: { type: 'deal_stage_changed', stage: 'proposal' },
          actions: [{ type: 'create_task', title: 'Send proposal follow-up' }],
        },
        {
          organizationId,
          name: 'New lead → notify owner',
          enabled: true,
          trigger: { type: 'lead_created' },
          actions: [{ type: 'notify', message: 'New lead: {lead}' }],
        },
      ],
    })
  }
}
