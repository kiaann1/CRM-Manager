import { Router } from 'express'
import { z } from 'zod'
import { writeAudit } from '../lib/audit.js'
import { prisma } from '../lib/prisma.js'
import type { AuthRequest } from '../middleware/auth.js'
import { requireAuth } from '../middleware/auth.js'

export const crmExtrasRouter = Router()
crmExtrasRouter.use(requireAuth)

const param = (value: string | string[] | undefined) => String(value ?? '')

// ——— Tags ———
crmExtrasRouter.post('/tags', async (req: AuthRequest, res) => {
  const body = z
    .object({ name: z.string().min(1), color: z.string().optional() })
    .parse(req.body)
  const tag = await prisma.tag.create({
    data: {
      organizationId: req.auth!.orgId,
      name: body.name.trim(),
      color: body.color ?? '#6366f1',
    },
  })
  res.status(201).json(tag)
})

// ——— Quotes ———
const quoteLineSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
})

crmExtrasRouter.post('/quotes', async (req: AuthRequest, res) => {
  const body = z
    .object({
      dealId: z.string(),
      title: z.string().min(1),
      lines: z.array(quoteLineSchema).min(1),
      status: z.enum(['draft', 'sent', 'accepted', 'rejected']).optional(),
    })
    .parse(req.body)
  const deal = await prisma.deal.findFirst({
    where: { id: body.dealId, organizationId: req.auth!.orgId },
  })
  if (!deal) {
    res.status(404).json({ error: 'Deal not found' })
    return
  }
  const quote = await prisma.quote.create({
    data: {
      organizationId: req.auth!.orgId,
      dealId: body.dealId,
      title: body.title,
      lines: body.lines,
      status: body.status ?? 'draft',
    },
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'quote.created', 'quote', quote.id)
  res.status(201).json(quote)
})

crmExtrasRouter.patch('/quotes/:id', async (req: AuthRequest, res) => {
  const body = z
    .object({
      title: z.string().min(1).optional(),
      lines: z.array(quoteLineSchema).optional(),
      status: z.enum(['draft', 'sent', 'accepted', 'rejected']).optional(),
    })
    .parse(req.body)
  const quote = await prisma.quote.update({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
    data: {
      title: body.title,
      lines: body.lines,
      status: body.status,
    },
  })
  res.json(quote)
})

crmExtrasRouter.delete('/quotes/:id', async (req: AuthRequest, res) => {
  await prisma.quote.delete({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  res.status(204).end()
})

// ——— Custom fields ———
crmExtrasRouter.post('/custom-field-defs', async (req: AuthRequest, res) => {
  const body = z
    .object({
      entityType: z.string().min(1),
      label: z.string().min(1),
      type: z.string().min(1),
      options: z.array(z.string()).optional(),
    })
    .parse(req.body)
  const def = await prisma.customFieldDef.create({
    data: {
      organizationId: req.auth!.orgId,
      entityType: body.entityType,
      label: body.label,
      type: body.type,
      options: body.options ?? [],
    },
  })
  res.status(201).json(def)
})

crmExtrasRouter.put('/custom-field-values', async (req: AuthRequest, res) => {
  const body = z
    .object({
      fieldId: z.string(),
      entityId: z.string(),
      value: z.unknown(),
    })
    .parse(req.body)
  const field = await prisma.customFieldDef.findFirst({
    where: { id: body.fieldId, organizationId: req.auth!.orgId },
  })
  if (!field) {
    res.status(404).json({ error: 'Field not found' })
    return
  }
  const row = await prisma.customFieldValue.upsert({
    where: { fieldId_entityId: { fieldId: body.fieldId, entityId: body.entityId } },
    create: { fieldId: body.fieldId, entityId: body.entityId, value: body.value as object },
    update: { value: body.value as object },
  })
  res.json(row)
})

// ——— Tickets ———
crmExtrasRouter.post('/tickets', async (req: AuthRequest, res) => {
  const body = z
    .object({
      subject: z.string().min(1),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      companyId: z.string().nullable().optional(),
      contactId: z.string().nullable().optional(),
      assigneeId: z.string(),
      slaDue: z.string().nullable().optional(),
    })
    .parse(req.body)
  const ticket = await prisma.ticket.create({
    data: {
      organizationId: req.auth!.orgId,
      subject: body.subject,
      description: body.description ?? '',
      status: body.status ?? 'open',
      priority: body.priority ?? 'medium',
      companyId: body.companyId ?? null,
      contactId: body.contactId ?? null,
      assigneeId: body.assigneeId,
      slaDue: body.slaDue ? new Date(body.slaDue) : null,
    },
  })
  res.status(201).json(ticket)
})

// ——— Board items ———
crmExtrasRouter.post('/board-items', async (req: AuthRequest, res) => {
  const body = z
    .object({
      boardId: z.string(),
      columnId: z.string(),
      title: z.string().min(1),
      ownerId: z.string(),
      dueDate: z.string().nullable().optional(),
      recordType: z.string().nullable().optional(),
      recordId: z.string().nullable().optional(),
    })
    .parse(req.body)
  const board = await prisma.board.findFirst({
    where: { id: body.boardId, organizationId: req.auth!.orgId },
  })
  if (!board) {
    res.status(404).json({ error: 'Board not found' })
    return
  }
  const maxOrder = await prisma.boardItem.aggregate({
    where: { columnId: body.columnId },
    _max: { order: true },
  })
  const item = await prisma.boardItem.create({
    data: {
      boardId: body.boardId,
      columnId: body.columnId,
      title: body.title,
      ownerId: body.ownerId,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      recordType: body.recordType ?? null,
      recordId: body.recordId ?? null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  })
  res.status(201).json(item)
})

crmExtrasRouter.patch('/board-items/:id', async (req: AuthRequest, res) => {
  const body = z
    .object({
      columnId: z.string().optional(),
      title: z.string().min(1).optional(),
      order: z.number().optional(),
      dueDate: z.string().nullable().optional(),
    })
    .parse(req.body)
  const existing = await prisma.boardItem.findFirst({
    where: { id: param(req.params.id) },
    include: { board: true },
  })
  if (!existing || existing.board.organizationId !== req.auth!.orgId) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  if (body.columnId && body.columnId !== existing.columnId) {
    const maxOrder = await prisma.boardItem.aggregate({
      where: { columnId: body.columnId },
      _max: { order: true },
    })
    body.order = (maxOrder._max.order ?? -1) + 1
  }
  const item = await prisma.boardItem.update({
    where: { id: existing.id },
    data: {
      columnId: body.columnId,
      title: body.title,
      order: body.order,
      dueDate:
        body.dueDate === undefined
          ? undefined
          : body.dueDate
            ? new Date(body.dueDate)
            : null,
    },
  })
  res.json(item)
})

crmExtrasRouter.delete('/board-items/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.boardItem.findFirst({
    where: { id: param(req.params.id) },
    include: { board: true },
  })
  if (!existing || existing.board.organizationId !== req.auth!.orgId) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.boardItem.delete({ where: { id: existing.id } })
  res.status(204).end()
})

// ——— Products ———
crmExtrasRouter.post('/products', async (req: AuthRequest, res) => {
  const body = z
    .object({ name: z.string().min(1), sku: z.string().min(1), price: z.number().nonnegative() })
    .parse(req.body)
  const product = await prisma.product.create({
    data: {
      organizationId: req.auth!.orgId,
      name: body.name.trim(),
      sku: body.sku.trim(),
      price: body.price,
    },
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'product.created', 'product', product.id)
  res.status(201).json(product)
})

crmExtrasRouter.patch('/products/:id', async (req: AuthRequest, res) => {
  const body = z
    .object({
      name: z.string().min(1).optional(),
      sku: z.string().min(1).optional(),
      price: z.number().nonnegative().optional(),
    })
    .parse(req.body)
  const existing = await prisma.product.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const product = await prisma.product.update({ where: { id: existing.id }, data: body })
  res.json(product)
})

crmExtrasRouter.delete('/products/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.product.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.product.delete({ where: { id: existing.id } })
  res.status(204).end()
})

// ——— Contracts ———
crmExtrasRouter.post('/contracts', async (req: AuthRequest, res) => {
  const body = z
    .object({
      dealId: z.string(),
      title: z.string().min(1),
      status: z.string().optional(),
      signUrl: z.string().optional(),
    })
    .parse(req.body)
  const deal = await prisma.deal.findFirst({
    where: { id: body.dealId, organizationId: req.auth!.orgId },
  })
  if (!deal) {
    res.status(404).json({ error: 'Deal not found' })
    return
  }
  const contract = await prisma.contract.create({
    data: {
      organizationId: req.auth!.orgId,
      dealId: body.dealId,
      title: body.title.trim(),
      status: body.status ?? 'draft',
      signUrl: body.signUrl ?? '',
    },
  })
  res.status(201).json(contract)
})

crmExtrasRouter.patch('/contracts/:id', async (req: AuthRequest, res) => {
  const body = z
    .object({
      title: z.string().min(1).optional(),
      status: z.string().optional(),
      signUrl: z.string().optional(),
    })
    .parse(req.body)
  const existing = await prisma.contract.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const contract = await prisma.contract.update({ where: { id: existing.id }, data: body })
  res.json(contract)
})

// ——— File attachments (metadata; optional inline data URL in storageKey) ———
crmExtrasRouter.post('/files', async (req: AuthRequest, res) => {
  const body = z
    .object({
      recordType: z.string().min(1),
      recordId: z.string().min(1),
      name: z.string().min(1),
      size: z.number().int().nonnegative(),
      mimeType: z.string(),
      storageKey: z.string().optional(),
    })
    .parse(req.body)
  const file = await prisma.fileAttachment.create({
    data: {
      organizationId: req.auth!.orgId,
      recordType: body.recordType,
      recordId: body.recordId,
      name: body.name,
      size: body.size,
      mimeType: body.mimeType,
      storageKey: body.storageKey ?? null,
    },
  })
  res.status(201).json(file)
})

crmExtrasRouter.delete('/files/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.fileAttachment.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.fileAttachment.delete({ where: { id: existing.id } })
  res.status(204).end()
})

// ——— Inbox ———
crmExtrasRouter.post('/inbox', async (req: AuthRequest, res) => {
  const body = z
    .object({
      subject: z.string().min(1).max(200),
      body: z.string().min(1).max(20000),
      teamId: z.string().optional(),
      recipientUserId: z.string().optional(),
    })
    .refine((d) => Boolean(d.teamId) !== Boolean(d.recipientUserId), {
      message: 'Choose either a team or a user recipient',
    })
    .parse(req.body)

  const orgId = req.auth!.orgId
  const senderId = req.auth!.sub

  const sender = await prisma.user.findUnique({ where: { id: senderId } })
  if (!sender) {
    res.status(401).json({ error: 'User not found' })
    return
  }

  if (body.teamId) {
    const team = await prisma.team.findFirst({
      where: { id: body.teamId, organizationId: orgId },
    })
    if (!team) {
      res.status(400).json({ error: 'Team not found' })
      return
    }
  }

  if (body.recipientUserId) {
    if (body.recipientUserId === senderId) {
      res.status(400).json({ error: 'Cannot message yourself' })
      return
    }
    const recipientMember = await prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId: body.recipientUserId, organizationId: orgId },
      },
    })
    if (!recipientMember) {
      res.status(400).json({ error: 'Recipient is not in this organization' })
      return
    }
  }

  const msg = await prisma.inboxMessage.create({
    data: {
      organizationId: orgId,
      teamId: body.teamId ?? null,
      senderId,
      recipientUserId: body.recipientUserId ?? null,
      from: sender.name,
      subject: body.subject.trim(),
      body: body.body.trim(),
      read: false,
      readByUserIds: [senderId],
    },
  })

  if (body.recipientUserId) {
    await prisma.notification.create({
      data: {
        userId: body.recipientUserId,
        title: `Message from ${sender.name}`,
        body: body.subject,
        read: false,
      },
    })
  } else if (body.teamId) {
    const teammates = await prisma.membership.findMany({
      where: { organizationId: orgId, teamId: body.teamId, userId: { not: senderId } },
    })
    await prisma.notification.createMany({
      data: teammates.map((m) => ({
        userId: m.userId,
        title: `${sender.name} posted in team chat`,
        body: body.subject,
        read: false,
      })),
    })
  }

  res.status(201).json({
    id: msg.id,
    teamId: msg.teamId,
    senderId: msg.senderId,
    recipientUserId: msg.recipientUserId,
    from: msg.from,
    subject: msg.subject,
    body: msg.body,
    read: true,
    receivedAt: msg.receivedAt.toISOString(),
  })
})

crmExtrasRouter.patch('/inbox/:id/read', async (req: AuthRequest, res) => {
  const existing = await prisma.inboxMessage.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const userId = req.auth!.sub
  const readBy = Array.isArray(existing.readByUserIds)
    ? (existing.readByUserIds as string[])
    : []
  const nextReadBy = readBy.includes(userId) ? readBy : [...readBy, userId]
  const msg = await prisma.inboxMessage.update({
    where: { id: existing.id },
    data: { readByUserIds: nextReadBy, read: true },
  })
  res.json({
    id: msg.id,
    read: true,
    readByUserIds: msg.readByUserIds,
  })
})

// ——— Contact merge ———
crmExtrasRouter.post('/contacts/merge', async (req: AuthRequest, res) => {
  const body = z
    .object({ primaryId: z.string(), duplicateId: z.string() })
    .parse(req.body)
  if (body.primaryId === body.duplicateId) {
    res.status(400).json({ error: 'Cannot merge contact with itself' })
    return
  }
  const orgId = req.auth!.orgId
  const [primary, duplicate] = await Promise.all([
    prisma.contact.findFirst({ where: { id: body.primaryId, organizationId: orgId } }),
    prisma.contact.findFirst({ where: { id: body.duplicateId, organizationId: orgId } }),
  ])
  if (!primary || !duplicate) {
    res.status(404).json({ error: 'Contact not found' })
    return
  }

  await prisma.$transaction([
    prisma.activity.updateMany({
      where: { recordType: 'contact', recordId: duplicate.id },
      data: { recordId: primary.id },
    }),
    prisma.comment.updateMany({
      where: { recordType: 'contact', recordId: duplicate.id },
      data: { recordId: primary.id },
    }),
    prisma.emailLog.updateMany({
      where: { recordType: 'contact', recordId: duplicate.id },
      data: { recordId: primary.id },
    }),
    prisma.task.updateMany({
      where: { contactId: duplicate.id },
      data: { contactId: primary.id },
    }),
    prisma.deal.updateMany({
      where: { contactId: duplicate.id },
      data: { contactId: primary.id },
    }),
    prisma.fileAttachment.updateMany({
      where: { recordType: 'contact', recordId: duplicate.id },
      data: { recordId: primary.id },
    }),
    prisma.customFieldValue.updateMany({
      where: { entityId: duplicate.id },
      data: { entityId: primary.id },
    }),
    prisma.ticket.updateMany({
      where: { contactId: duplicate.id },
      data: { contactId: primary.id },
    }),
    prisma.contactTag.deleteMany({ where: { contactId: duplicate.id } }),
    prisma.contact.delete({ where: { id: duplicate.id } }),
  ])

  await writeAudit(req.auth!.orgId, req.auth!.sub, 'contact.merged', 'contact', primary.id)
  const merged = await prisma.contact.findUnique({
    where: { id: primary.id },
    include: { tags: true },
  })
  res.json({
    ...merged,
    tagIds: merged?.tags.map((t) => t.tagId) ?? [],
  })
})

// ——— Pipeline stages ———
crmExtrasRouter.patch('/pipeline-stages/:id', async (req: AuthRequest, res) => {
  const body = z
    .object({
      label: z.string().min(1).optional(),
      probability: z.number().int().min(0).max(100).optional(),
      color: z.string().optional(),
    })
    .parse(req.body)
  const stage = await prisma.pipelineStage.findFirst({
    where: { id: param(req.params.id) },
    include: { pipeline: true },
  })
  if (!stage || stage.pipeline.organizationId !== req.auth!.orgId) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const updated = await prisma.pipelineStage.update({
    where: { id: stage.id },
    data: body,
  })
  res.json(updated)
})

// ——— Campaigns ———
crmExtrasRouter.post('/campaigns', async (req: AuthRequest, res) => {
  const body = z
    .object({
      name: z.string().min(1),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      budget: z.number().nonnegative().optional(),
    })
    .parse(req.body)
  const campaign = await prisma.campaign.create({
    data: {
      organizationId: req.auth!.orgId,
      name: body.name.trim(),
      utmSource: body.utmSource ?? '',
      utmMedium: body.utmMedium ?? '',
      budget: body.budget ?? 0,
    },
  })
  res.status(201).json(campaign)
})

crmExtrasRouter.patch('/campaigns/:id', async (req: AuthRequest, res) => {
  const body = z
    .object({
      name: z.string().min(1).optional(),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      budget: z.number().nonnegative().optional(),
    })
    .parse(req.body)
  const existing = await prisma.campaign.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const campaign = await prisma.campaign.update({ where: { id: existing.id }, data: body })
  res.json(campaign)
})

crmExtrasRouter.delete('/campaigns/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.campaign.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.campaign.delete({ where: { id: existing.id } })
  res.status(204).end()
})

// ——— Boards ———
crmExtrasRouter.post('/boards', async (req: AuthRequest, res) => {
  const body = z.object({ name: z.string().min(1) }).parse(req.body)
  const board = await prisma.board.create({
    data: {
      organizationId: req.auth!.orgId,
      name: body.name.trim(),
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
  res.status(201).json(board)
})

// ——— Approvals ———
crmExtrasRouter.post('/approvals', async (req: AuthRequest, res) => {
  const body = z
    .object({
      dealId: z.string(),
      title: z.string().min(1),
      approverId: z.string(),
    })
    .parse(req.body)
  const deal = await prisma.deal.findFirst({
    where: { id: body.dealId, organizationId: req.auth!.orgId },
  })
  if (!deal) {
    res.status(404).json({ error: 'Deal not found' })
    return
  }
  const approval = await prisma.approval.create({
    data: {
      organizationId: req.auth!.orgId,
      dealId: body.dealId,
      title: body.title.trim(),
      requesterId: req.auth!.sub,
      approverId: body.approverId,
      status: 'pending',
    },
  })
  await prisma.notification.create({
    data: {
      userId: body.approverId,
      title: 'Approval requested',
      body: `${body.title} on deal “${deal.title}”`,
      read: false,
    },
  })
  res.status(201).json(approval)
})

crmExtrasRouter.patch('/approvals/:id', async (req: AuthRequest, res) => {
  const body = z.object({ status: z.enum(['approved', 'rejected']) }).parse(req.body)
  const existing = await prisma.approval.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  if (existing.approverId !== req.auth!.sub) {
    res.status(403).json({ error: 'Only the assigned approver can respond' })
    return
  }
  const approval = await prisma.approval.update({
    where: { id: existing.id },
    data: { status: body.status },
  })
  await prisma.notification.create({
    data: {
      userId: existing.requesterId,
      title: body.status === 'approved' ? 'Deal approved' : 'Deal approval declined',
      body: existing.title,
      read: false,
    },
  })
  res.json(approval)
})

// ——— Surveys (NPS) ———
crmExtrasRouter.post('/surveys', async (req: AuthRequest, res) => {
  const body = z
    .object({
      companyId: z.string(),
      score: z.number().int().min(0).max(10),
      feedback: z.string().optional(),
    })
    .parse(req.body)
  const company = await prisma.company.findFirst({
    where: { id: body.companyId, organizationId: req.auth!.orgId },
  })
  if (!company) {
    res.status(404).json({ error: 'Company not found' })
    return
  }
  const survey = await prisma.survey.create({
    data: {
      organizationId: req.auth!.orgId,
      companyId: body.companyId,
      score: body.score,
      feedback: body.feedback ?? '',
    },
  })
  const health = Math.min(100, Math.max(0, body.score * 10))
  await prisma.company.update({
    where: { id: company.id },
    data: { healthScore: health },
  })
  res.status(201).json(survey)
})

// ——— Time entries ———
crmExtrasRouter.post('/time-entries', async (req: AuthRequest, res) => {
  const body = z
    .object({
      taskId: z.string(),
      minutes: z.number().int().positive(),
      note: z.string().optional(),
      date: z.string().optional(),
    })
    .parse(req.body)
  const task = await prisma.task.findFirst({
    where: { id: body.taskId, organizationId: req.auth!.orgId },
  })
  if (!task) {
    res.status(404).json({ error: 'Task not found' })
    return
  }
  const entry = await prisma.timeEntry.create({
    data: {
      taskId: body.taskId,
      userId: req.auth!.sub,
      minutes: body.minutes,
      note: body.note ?? '',
      date: body.date ? new Date(body.date) : new Date(),
    },
  })
  await prisma.task.update({
    where: { id: task.id },
    data: { loggedMinutes: task.loggedMinutes + body.minutes },
  })
  res.status(201).json(entry)
})
