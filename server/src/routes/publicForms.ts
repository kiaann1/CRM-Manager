import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { computeLeadScore } from '../lib/lead-score.js'
import { emitCrmEvent } from '../services/crmEvents.js'
import { runLeadCreatedAutomations } from '../services/automations.js'

export const publicFormsRouter = Router()

const submitSchema = z.object({
  values: z.record(z.string()),
})

publicFormsRouter.post('/forms/:id/submit', async (req, res) => {
  const formId = String(req.params.id)
  const body = submitSchema.parse(req.body)

  const form = await prisma.marketingForm.findUnique({
    where: { id: formId },
    include: {
      organization: {
        include: {
          memberships: { take: 1, orderBy: { createdAt: 'asc' } },
        },
      },
    },
  })
  if (!form) {
    res.status(404).json({ error: 'Form not found' })
    return
  }

  const ownerId = form.organization.memberships[0]?.userId
  if (!ownerId) {
    res.status(503).json({ error: 'Organization not ready' })
    return
  }

  const fields = Array.isArray(form.fields) ? (form.fields as { id: string; label?: string }[]) : []
  const emailField = fields.find((f) => f.id === 'email' || f.id.includes('email'))
  const email = (body.values[emailField?.id ?? 'email'] ?? body.values.email ?? '').trim()
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email is required' })
    return
  }

  const companyName =
    (body.values.company ?? body.values.Company ?? body.values.organization ?? '').trim() ||
    'Website lead'

  const firstName =
    (body.values.firstName ?? body.values.name ?? email.split('@')[0] ?? 'Lead').trim() || 'Lead'
  const lastName = (body.values.lastName ?? '').trim()

  const leadData = {
    email,
    phone: (body.values.phone ?? '').trim(),
    stage: 'new',
    utmSource: (body.values.utm_source ?? form.name).trim(),
  }

  const lead = await prisma.lead.create({
    data: {
      organizationId: form.organizationId,
      firstName,
      lastName,
      email,
      phone: leadData.phone,
      company: companyName,
      stage: 'new',
      ownerId,
      source: `Form: ${form.name}`,
      utmSource: leadData.utmSource,
      score: computeLeadScore(leadData),
    },
  })

  const submissions = Array.isArray(form.submissions) ? [...(form.submissions as object[])] : []
  submissions.push({
    id: `sub-${Date.now()}`,
    data: body.values,
    at: new Date().toISOString(),
  })
  await prisma.marketingForm.update({
    where: { id: form.id },
    data: { submissions },
  })

  await emitCrmEvent(form.organizationId, 'lead.created', {
    id: lead.id,
    email: lead.email,
    source: lead.source,
    formId: form.id,
  })

  await runLeadCreatedAutomations(form.organizationId, {
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    ownerId: lead.ownerId,
  })

  const admins = await prisma.membership.findMany({
    where: { organizationId: form.organizationId, role: { in: ['admin', 'manager'] } },
    select: { userId: true },
  })
  const notifyIds = [...new Set([ownerId, ...admins.map((m) => m.userId)])]
  await prisma.notification.createMany({
    data: notifyIds.map((userId) => ({
      userId,
      title: 'New form submission',
      body: `${firstName} ${lastName}`.trim() + ` — ${form.name}`,
      linkPath: '/leads',
      read: false,
    })),
  })

  res.status(201).json({ ok: true, leadId: lead.id })
})
