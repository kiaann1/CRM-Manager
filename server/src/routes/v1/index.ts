import type { Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { writeAudit } from '../../lib/audit.js'
import { prisma } from '../../lib/prisma.js'
import type { AuthRequest } from '../../middleware/auth.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { computeLeadScore } from '../../lib/lead-score.js'
import { buildBootstrap } from '../../services/bootstrap.js'
import { runDealStageAutomations, runLeadCreatedAutomations } from '../../services/automations.js'
import { emitCrmEvent } from '../../services/crmEvents.js'
import { dispatchWebhooks } from '../../services/webhooks.js'
import { createHash, randomBytes } from 'crypto'
import { integrationsRouter } from '../integrations.js'
import { invitesRouter } from '../invites.js'
import { crmExtrasRouter } from '../crmExtras.js'
import { searchRouter } from '../search.js'
import { savedViewsRouter } from '../savedViews.js'
import {
  preferencesCurrencySchema,
  preferencesLocaleSchema,
  preferencesTimezoneSchema,
} from '../../lib/regionalPrefs.js'

export const v1Router = Router()
v1Router.use(requireAuth)

const param = (value: string | string[] | undefined) => String(value ?? '')

v1Router.use('/search', searchRouter)

v1Router.get('/bootstrap', async (req: AuthRequest, res, next) => {
  try {
    const data = await buildBootstrap(req.auth!.orgId, req.auth!.sub)
    res.json(data)
  } catch (err) {
    console.error('[GET /api/v1/bootstrap]', err)
    next(err)
  }
})

// ——— Contacts ———
const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().default(''),
  email: z.string().email(),
  phone: z.string().optional(),
  companyId: z.string().nullable().optional(),
  title: z.string().optional(),
  ownerId: z.string(),
  tagIds: z.array(z.string()).optional(),
})

v1Router.post('/contacts', async (req: AuthRequest, res) => {
  const body = contactSchema.parse(req.body)
  const contact = await prisma.contact.create({
    data: {
      organizationId: req.auth!.orgId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone ?? '',
      companyId: body.companyId ?? null,
      title: body.title ?? '',
      ownerId: body.ownerId,
      tags: body.tagIds?.length
        ? { create: body.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'contact.created', 'contact', contact.id)
  await emitCrmEvent(req.auth!.orgId, 'contact.created', {
    id: contact.id,
    email: contact.email,
    firstName: contact.firstName,
    lastName: contact.lastName,
  })
  res.status(201).json(contact)
})

v1Router.patch('/contacts/:id', async (req: AuthRequest, res) => {
  const body = contactSchema.partial().parse(req.body)
  const contact = await prisma.contact.update({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
    data: {
      ...body,
      tags: body.tagIds
        ? { deleteMany: {}, create: body.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'contact.updated', 'contact', contact.id)
  await emitCrmEvent(req.auth!.orgId, 'contact.updated', { id: contact.id })
  res.json(contact)
})

v1Router.delete('/contacts/:id', async (req: AuthRequest, res) => {
  await prisma.contact.delete({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'contact.deleted', 'contact', param(req.params.id))
  res.status(204).end()
})

// ——— Deals ———
const dealSchema = z.object({
  title: z.string().min(1),
  value: z.number(),
  stageKey: z.string(),
  pipelineId: z.string(),
  contactId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  ownerId: z.string(),
  expectedClose: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})

v1Router.post('/deals', async (req: AuthRequest, res) => {
  const body = dealSchema.parse(req.body)
  const stage = await prisma.pipelineStage.findFirst({
    where: { pipelineId: body.pipelineId, key: body.stageKey },
  })
  const deal = await prisma.deal.create({
    data: {
      organizationId: req.auth!.orgId,
      title: body.title,
      value: body.value,
      stageKey: body.stageKey,
      pipelineId: body.pipelineId,
      stageId: stage?.id,
      contactId: body.contactId ?? null,
      companyId: body.companyId ?? null,
      ownerId: body.ownerId,
      expectedClose: body.expectedClose ? new Date(body.expectedClose) : null,
      tags: body.tagIds?.length
        ? { create: body.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'deal.created', 'deal', deal.id)
  await emitCrmEvent(req.auth!.orgId, 'deal.created', {
    id: deal.id,
    title: deal.title,
    stage: deal.stageKey,
    value: deal.value,
  })
  res.status(201).json(deal)
})

v1Router.patch('/deals/:id', async (req: AuthRequest, res) => {
  const body = dealSchema.partial().parse(req.body)
  const existing = await prisma.deal.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const stageKey = body.stageKey ?? existing.stageKey
  const stage = body.pipelineId || body.stageKey
    ? await prisma.pipelineStage.findFirst({
        where: {
          pipelineId: body.pipelineId ?? existing.pipelineId,
          key: stageKey,
        },
      })
    : null
  const deal = await prisma.deal.update({
    where: { id: param(req.params.id) },
    data: {
      title: body.title,
      value: body.value,
      stageKey,
      pipelineId: body.pipelineId,
      stageId: stage?.id,
      contactId: body.contactId,
      companyId: body.companyId,
      ownerId: body.ownerId,
      expectedClose: body.expectedClose ? new Date(body.expectedClose) : undefined,
      tags: body.tagIds
        ? { deleteMany: {}, create: body.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  })
  if (body.stageKey && body.stageKey !== existing.stageKey) {
    const stagePayload = {
      id: deal.id,
      title: deal.title,
      from: existing.stageKey,
      to: body.stageKey,
      value: deal.value,
    }
    await emitCrmEvent(req.auth!.orgId, 'deal.stage_changed', stagePayload)
    if (body.stageKey === 'won') {
      await emitCrmEvent(req.auth!.orgId, 'deal.won', stagePayload)
    }
    if (body.stageKey === 'lost') {
      await emitCrmEvent(req.auth!.orgId, 'deal.lost', stagePayload)
    }
    await runDealStageAutomations(
      req.auth!.orgId,
      {
        id: deal.id,
        title: deal.title,
        stageKey: deal.stageKey,
        ownerId: deal.ownerId,
        contactId: deal.contactId,
        companyId: deal.companyId,
      },
      existing.stageKey,
    )
  }
  await emitCrmEvent(req.auth!.orgId, 'deal.updated', {
    id: deal.id,
    title: deal.title,
    stage: deal.stageKey,
    value: deal.value,
    changes: Object.keys(body),
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'deal.updated', 'deal', deal.id)
  res.json(deal)
})

// ——— Companies ———
v1Router.post('/companies', async (req: AuthRequest, res) => {
  const body = z
    .object({
      name: z.string().min(1),
      industry: z.string().optional(),
      website: z.string().optional(),
      phone: z.string().optional(),
      ownerId: z.string(),
      healthScore: z.number().optional(),
    })
    .parse(req.body)
  const company = await prisma.company.create({
    data: {
      organizationId: req.auth!.orgId,
      name: body.name,
      industry: body.industry ?? '',
      website: body.website ?? '',
      phone: body.phone ?? '',
      ownerId: body.ownerId,
      healthScore: body.healthScore ?? 70,
    },
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'company.created', 'company', company.id)
  res.status(201).json(company)
})

v1Router.patch('/companies/:id', async (req: AuthRequest, res) => {
  const company = await prisma.company.update({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
    data: req.body,
  })
  res.json(company)
})

v1Router.delete('/companies/:id', async (req: AuthRequest, res) => {
  await prisma.company.delete({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'company.deleted', 'company', param(req.params.id))
  res.status(204).end()
})

v1Router.delete('/deals/:id', async (req: AuthRequest, res) => {
  const id = param(req.params.id)
  const existing = await prisma.deal.findFirst({
    where: { id, organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.deal.delete({ where: { id } })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'deal.deleted', 'deal', id)
  await emitCrmEvent(req.auth!.orgId, 'deal.deleted', {
    id,
    title: existing.title,
    stage: existing.stageKey,
  })
  res.status(204).end()
})

// ——— Leads ———
v1Router.post('/leads', async (req: AuthRequest, res) => {
  const body = z
    .object({
      firstName: z.string(),
      lastName: z.string().optional(),
      email: z.string().email(),
      phone: z.string().optional(),
      company: z.string().optional(),
      stage: z.string().optional(),
      ownerId: z.string(),
      source: z.string().optional(),
      utmSource: z.string().optional(),
      tagIds: z.array(z.string()).optional(),
    })
    .parse(req.body)
  const stage = body.stage ?? 'new'
  const leadData = {
    email: body.email,
    phone: body.phone ?? '',
    stage,
    utmSource: body.utmSource ?? '',
  }
  const lead = await prisma.lead.create({
    data: {
      organizationId: req.auth!.orgId,
      firstName: body.firstName,
      lastName: body.lastName ?? '',
      email: leadData.email,
      phone: leadData.phone,
      company: body.company ?? '',
      stage,
      ownerId: body.ownerId,
      source: body.source ?? 'Manual',
      utmSource: leadData.utmSource,
      score: computeLeadScore(leadData),
      tags: body.tagIds?.length
        ? { create: body.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: { tags: true },
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'lead.created', 'lead', lead.id)
  await emitCrmEvent(req.auth!.orgId, 'lead.created', {
    id: lead.id,
    email: lead.email,
    firstName: lead.firstName,
    lastName: lead.lastName,
    stage: lead.stage,
  })
  res.status(201).json({ ...lead, tagIds: lead.tags.map((t) => t.tagId) })
})

v1Router.post('/leads/:id/convert', async (req: AuthRequest, res) => {
  const lead = await prisma.lead.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!lead) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const contact = await prisma.contact.create({
    data: {
      organizationId: req.auth!.orgId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      ownerId: lead.ownerId,
      leadId: lead.id,
    },
  })
  await prisma.lead.update({
    where: { id: lead.id },
    data: { stage: 'converted', convertedContactId: contact.id, score: 100 },
  })
  await emitCrmEvent(req.auth!.orgId, 'contact.created', {
    id: contact.id,
    email: contact.email,
    fromLeadId: lead.id,
  })
  await emitCrmEvent(req.auth!.orgId, 'lead.converted', {
    leadId: lead.id,
    contactId: contact.id,
    email: lead.email,
  })
  res.json({ contact })
})

v1Router.patch('/leads/:id', async (req: AuthRequest, res) => {
  const body = z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      stage: z.string().optional(),
      ownerId: z.string().optional(),
      source: z.string().optional(),
      utmSource: z.string().optional(),
      tagIds: z.array(z.string()).optional(),
    })
    .parse(req.body)
  const existing = await prisma.lead.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const merged = {
    email: body.email ?? existing.email,
    phone: body.phone ?? existing.phone,
    stage: body.stage ?? existing.stage,
    utmSource: body.utmSource ?? existing.utmSource,
  }
  const { tagIds, ...rest } = body
  const lead = await prisma.lead.update({
    where: { id: existing.id },
    data: {
      ...rest,
      score: computeLeadScore(merged),
      tags: tagIds
        ? { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: { tags: true },
  })
  await emitCrmEvent(req.auth!.orgId, 'lead.updated', {
    id: lead.id,
    email: lead.email,
    stage: lead.stage,
    score: lead.score,
  })
  res.json({ ...lead, tagIds: lead.tags.map((t) => t.tagId) })
})

v1Router.delete('/leads/:id', async (req: AuthRequest, res) => {
  await prisma.lead.delete({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  res.status(204).end()
})

// ——— Tasks ———
v1Router.post('/tasks', async (req: AuthRequest, res) => {
  const body = z
    .object({
      title: z.string(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      priority: z.string().optional(),
      status: z.string().optional(),
      ownerId: z.string(),
      dealId: z.string().nullable().optional(),
      contactId: z.string().nullable().optional(),
    })
    .parse(req.body)
  const task = await prisma.task.create({
    data: {
      organizationId: req.auth!.orgId,
      title: body.title,
      description: body.description ?? '',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      priority: body.priority ?? 'medium',
      status: body.status ?? 'todo',
      ownerId: body.ownerId,
      dealId: body.dealId ?? null,
      contactId: body.contactId ?? null,
    },
  })
  res.status(201).json(task)
})

v1Router.patch('/tasks/:id', async (req: AuthRequest, res) => {
  const body = req.body as Record<string, unknown>
  const task = await prisma.task.update({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
    data: {
      ...body,
      dueDate: body.dueDate ? new Date(String(body.dueDate)) : undefined,
    },
  })
  res.json(task)
})

v1Router.delete('/tasks/:id', async (req: AuthRequest, res) => {
  await prisma.task.delete({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  res.status(204).end()
})

// ——— Calendar events ———
v1Router.post('/calendar-events', async (req: AuthRequest, res) => {
  const body = z
    .object({
      title: z.string().min(1),
      start: z.string(),
      end: z.string(),
      recordType: z.string().nullable().optional(),
      recordId: z.string().nullable().optional(),
      userId: z.string(),
      externalSync: z.enum(['none', 'google', 'outlook']).optional(),
    })
    .parse(req.body)
  const event = await prisma.calendarEvent.create({
    data: {
      organizationId: req.auth!.orgId,
      title: body.title,
      start: new Date(body.start),
      end: new Date(body.end),
      recordType: body.recordType ?? null,
      recordId: body.recordId ?? null,
      userId: body.userId,
      externalSync: body.externalSync ?? 'none',
    },
  })
  res.status(201).json(event)
})

v1Router.patch('/calendar-events/:id', async (req: AuthRequest, res) => {
  const body = z
    .object({
      title: z.string().min(1).optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      recordType: z.string().nullable().optional(),
      recordId: z.string().nullable().optional(),
      externalSync: z.enum(['none', 'google', 'outlook']).optional(),
    })
    .parse(req.body)
  const existing = await prisma.calendarEvent.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const event = await prisma.calendarEvent.update({
    where: { id: existing.id },
    data: {
      title: body.title,
      start: body.start ? new Date(body.start) : undefined,
      end: body.end ? new Date(body.end) : undefined,
      recordType: body.recordType,
      recordId: body.recordId,
      externalSync: body.externalSync,
    },
  })
  res.json(event)
})

v1Router.delete('/calendar-events/:id', async (req: AuthRequest, res) => {
  await prisma.calendarEvent.delete({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  res.status(204).end()
})

// ——— Goals ———
v1Router.post('/goals', async (req: AuthRequest, res) => {
  const body = z
    .object({
      title: z.string().min(1),
      target: z.number().positive(),
      current: z.number().min(0).optional(),
      quarter: z.string().min(1),
      ownerId: z.string(),
    })
    .parse(req.body)
  const goal = await prisma.goal.create({
    data: {
      organizationId: req.auth!.orgId,
      title: body.title,
      target: body.target,
      current: body.current ?? 0,
      quarter: body.quarter,
      ownerId: body.ownerId,
    },
  })
  res.status(201).json(goal)
})

v1Router.patch('/goals/:id', async (req: AuthRequest, res) => {
  const body = z
    .object({
      title: z.string().min(1).optional(),
      target: z.number().positive().optional(),
      current: z.number().min(0).optional(),
      quarter: z.string().optional(),
      ownerId: z.string().optional(),
    })
    .parse(req.body)
  const goal = await prisma.goal.update({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
    data: body,
  })
  res.json(goal)
})

v1Router.delete('/goals/:id', async (req: AuthRequest, res) => {
  await prisma.goal.delete({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  res.status(204).end()
})

// ——— Sprints ———
v1Router.post('/sprints', async (req: AuthRequest, res) => {
  const body = z
    .object({
      name: z.string().min(1),
      start: z.string().min(1),
      end: z.string().min(1),
      teamId: z.string(),
    })
    .parse(req.body)
  const sprint = await prisma.sprint.create({
    data: {
      organizationId: req.auth!.orgId,
      name: body.name.trim(),
      start: new Date(body.start),
      end: new Date(body.end),
      teamId: body.teamId,
    },
  })
  res.status(201).json(sprint)
})

v1Router.patch('/sprints/:id', async (req: AuthRequest, res) => {
  const body = z
    .object({
      name: z.string().min(1).optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      teamId: z.string().optional(),
    })
    .parse(req.body)
  const existing = await prisma.sprint.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const sprint = await prisma.sprint.update({
    where: { id: existing.id },
    data: {
      name: body.name?.trim(),
      start: body.start ? new Date(body.start) : undefined,
      end: body.end ? new Date(body.end) : undefined,
      teamId: body.teamId,
    },
  })
  res.json(sprint)
})

v1Router.delete('/sprints/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.sprint.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.sprint.delete({ where: { id: existing.id } })
  res.status(204).end()
})

// ——— Documents ———
v1Router.post('/documents', async (req: AuthRequest, res) => {
  const body = z
    .object({
      title: z.string().min(1),
      content: z.string().default(''),
      recordType: z.string().nullable().optional(),
      recordId: z.string().nullable().optional(),
    })
    .parse(req.body)
  const doc = await prisma.document.create({
    data: {
      organizationId: req.auth!.orgId,
      title: body.title,
      content: body.content,
      recordType: body.recordType ?? null,
      recordId: body.recordId ?? null,
    },
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'document.created', 'document', doc.id)
  res.status(201).json(doc)
})

v1Router.patch('/documents/:id', async (req: AuthRequest, res) => {
  const body = z
    .object({
      title: z.string().min(1).optional(),
      content: z.string().optional(),
      recordType: z.string().nullable().optional(),
      recordId: z.string().nullable().optional(),
    })
    .parse(req.body)
  const doc = await prisma.document.update({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
    data: body,
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'document.updated', 'document', doc.id)
  res.json(doc)
})

v1Router.delete('/documents/:id', async (req: AuthRequest, res) => {
  await prisma.document.delete({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'document.deleted', 'document', param(req.params.id))
  res.status(204).end()
})

// ——— Activities & comments ———
v1Router.post('/activities', async (req: AuthRequest, res) => {
  const body = z
    .object({
      type: z.string(),
      subject: z.string(),
      body: z.string().optional(),
      recordType: z.string(),
      recordId: z.string(),
    })
    .parse(req.body)
  const activity = await prisma.activity.create({
    data: {
      organizationId: req.auth!.orgId,
      userId: req.auth!.sub,
      type: body.type,
      subject: body.subject,
      body: body.body ?? '',
      recordType: body.recordType,
      recordId: body.recordId,
    },
  })
  res.status(201).json(activity)
})

v1Router.post('/comments', async (req: AuthRequest, res) => {
  const body = z
    .object({
      recordType: z.string(),
      recordId: z.string(),
      body: z.string(),
      mentions: z.array(z.string()).optional(),
    })
    .parse(req.body)
  const comment = await prisma.comment.create({
    data: {
      organizationId: req.auth!.orgId,
      userId: req.auth!.sub,
      recordType: body.recordType,
      recordId: body.recordId,
      body: body.body,
      mentions: body.mentions ?? [],
    },
  })
  res.status(201).json(comment)
})

// ——— Webhooks ———
v1Router.get('/webhooks', async (req: AuthRequest, res) => {
  const hooks = await prisma.webhookEndpoint.findMany({
    where: { organizationId: req.auth!.orgId },
  })
  res.json(hooks)
})

v1Router.post('/webhooks', async (req: AuthRequest, res) => {
  const body = z
    .object({
      url: z.string().url(),
      events: z.array(z.string()),
      secret: z.string().optional(),
    })
    .parse(req.body)
  const hook = await prisma.webhookEndpoint.create({
    data: {
      organizationId: req.auth!.orgId,
      url: body.url,
      events: body.events,
      secret: body.secret,
    },
  })
  res.status(201).json(hook)
})

v1Router.post('/webhooks/:id/test', async (req: AuthRequest, res) => {
  const hook = await prisma.webhookEndpoint.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  if (!hook) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await dispatchWebhooks(req.auth!.orgId, 'webhook.test', {
    webhookId: hook.id,
    message: 'Test delivery from CRM Manager',
  })
  res.json({ ok: true })
})

// ——— API keys (programmatic access) ———
v1Router.get('/api-keys', requireRole('admin', 'manager'), async (req: AuthRequest, res) => {
  const keys = await prisma.apiKey.findMany({
    where: { organizationId: req.auth!.orgId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      createdAt: true,
    },
  })
  res.json(keys)
})

v1Router.post('/api-keys', requireRole('admin', 'manager'), async (req: AuthRequest, res) => {
  const body = z.object({ name: z.string().min(1) }).parse(req.body)
  const raw = `crm_${randomBytes(32).toString('base64url')}`
  const keyHash = createHash('sha256').update(raw).digest('hex')
  const prefix = raw.slice(0, 12)
  await prisma.apiKey.create({
    data: {
      organizationId: req.auth!.orgId,
      name: body.name,
      keyHash,
      prefix,
    },
  })
  res.status(201).json({ key: raw, prefix, message: 'Store this key securely; it will not be shown again.' })
})

v1Router.use('/invites', invitesRouter)
v1Router.use('/integrations', integrationsRouter)
v1Router.use(crmExtrasRouter)

// ——— Tickets, automations, notifications ———
v1Router.patch('/tickets/:id', async (req: AuthRequest, res) => {
  const body = z
    .object({
      status: z.string().optional(),
      priority: z.string().optional(),
      assigneeId: z.string().optional(),
      subject: z.string().optional(),
    })
    .parse(req.body)
  const ticket = await prisma.ticket.update({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
    data: body,
  })
  res.json(ticket)
})

v1Router.post('/automations', async (req: AuthRequest, res) => {
  const body = z
    .object({
      name: z.string().min(1),
      enabled: z.boolean().optional(),
      trigger: z.record(z.string(), z.unknown()),
      actions: z.array(z.record(z.string(), z.unknown())).min(1),
    })
    .parse(req.body)
  const rule = await prisma.automationRule.create({
    data: {
      organizationId: req.auth!.orgId,
      name: body.name.trim(),
      enabled: body.enabled ?? true,
      trigger: body.trigger as Prisma.InputJsonValue,
      actions: body.actions as Prisma.InputJsonValue,
    },
  })
  res.status(201).json(rule)
})

v1Router.patch('/automations/:id', async (req: AuthRequest, res) => {
  const body = z.object({ enabled: z.boolean() }).parse(req.body)
  const rule = await prisma.automationRule.update({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
    data: { enabled: body.enabled },
  })
  res.json(rule)
})

v1Router.delete('/automations/:id', async (req: AuthRequest, res) => {
  await prisma.automationRule.delete({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId },
  })
  res.status(204).end()
})

v1Router.patch('/notifications/:id/read', async (req: AuthRequest, res) => {
  const notification = await prisma.notification.findFirst({
    where: { id: param(req.params.id), userId: req.auth!.sub },
  })
  if (!notification) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { read: true },
  })
  res.json(updated)
})

v1Router.post('/notifications/read-all', async (req: AuthRequest, res) => {
  const result = await prisma.notification.updateMany({
    where: { userId: req.auth!.sub, read: false },
    data: { read: true },
  })
  res.json({ updated: result.count })
})

v1Router.post('/contacts/import', async (req: AuthRequest, res) => {
  const body = z
    .object({
      rows: z.array(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().optional(),
          email: z.string().email(),
          phone: z.string().optional(),
          title: z.string().optional(),
        }),
      ),
    })
    .parse(req.body)
  let created = 0
  for (const row of body.rows) {
    await prisma.contact.create({
      data: {
        organizationId: req.auth!.orgId,
        firstName: row.firstName,
        lastName: row.lastName ?? '',
        email: row.email,
        phone: row.phone ?? '',
        title: row.title ?? '',
        ownerId: req.auth!.sub,
      },
    })
    created++
  }
  res.status(201).json({ created })
})

v1Router.post('/leads/import', async (req: AuthRequest, res) => {
  const body = z
    .object({
      rows: z.array(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().optional(),
          email: z.string().email(),
          company: z.string().optional(),
          phone: z.string().optional(),
        }),
      ),
    })
    .parse(req.body)
  let created = 0
  for (const row of body.rows) {
    const leadData = {
      email: row.email,
      phone: row.phone ?? '',
      stage: 'new',
      utmSource: 'import',
    }
    await prisma.lead.create({
      data: {
        organizationId: req.auth!.orgId,
        firstName: row.firstName,
        lastName: row.lastName ?? '',
        email: row.email,
        phone: leadData.phone,
        company: row.company ?? '',
        stage: 'new',
        ownerId: req.auth!.sub,
        source: 'CSV import',
        utmSource: 'import',
        score: computeLeadScore(leadData),
      },
    })
    created++
  }
  res.status(201).json({ created })
})

// ——— User preferences ———
v1Router.patch('/preferences', async (req: AuthRequest, res) => {
  const body = z
    .object({
      theme: z
        .enum(['light', 'dark', 'system'])
        .optional()
        .transform((t) => (t === undefined ? undefined : t === 'dark' ? 'dark' : 'light')),
      emailDigest: z.boolean().optional(),
      pushEnabled: z.boolean().optional(),
      currency: preferencesCurrencySchema.optional(),
      locale: preferencesLocaleSchema.optional(),
      timezone: preferencesTimezoneSchema.optional(),
    })
    .parse(req.body)
  const prefs = await prisma.userPreference.upsert({
    where: { userId: req.auth!.sub },
    create: { userId: req.auth!.sub, ...body },
    update: body,
  })
  res.json(prefs)
})

// OpenAPI-style health for API consumers
v1Router.get('/openapi', (_req, res) => {
  res.json({
    openapi: '3.0.0',
    info: { title: 'CRM Manager API', version: '1.0.0' },
    paths: {
      '/api/v1/bootstrap': { get: { summary: 'Full workspace state' } },
      '/api/v1/contacts': { post: { summary: 'Create contact' } },
      '/api/v1/deals': { post: { summary: 'Create deal' } },
      '/api/v1/webhooks': { get: {}, post: {} },
      '/api/v1/api-keys': { post: { summary: 'Create API key' } },
      '/api/v1/invites': { get: {}, post: { summary: 'Invite user to org' } },
    },
  })
})
