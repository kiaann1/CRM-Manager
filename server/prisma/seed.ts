import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { createPrisma } from '../src/lib/prisma-client.js'

const prisma = createPrisma()

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo',
      teams: { create: { name: 'Sales', workspaceName: 'Main workspace' } },
      pipelines: {
        create: {
          name: 'Default sales pipeline',
          stages: {
            create: [
              { key: 'lead', label: 'Lead', order: 0, color: 'bg-slate-100 text-slate-700', probability: 10 },
              { key: 'qualified', label: 'Qualified', order: 1, color: 'bg-sky-100 text-sky-700', probability: 25 },
              { key: 'proposal', label: 'Proposal', order: 2, color: 'bg-violet-100 text-violet-700', probability: 50 },
              { key: 'negotiation', label: 'Negotiation', order: 3, color: 'bg-amber-100 text-amber-800', probability: 75 },
              { key: 'won', label: 'Won', order: 4, color: 'bg-emerald-100 text-emerald-700', probability: 100 },
              { key: 'lost', label: 'Lost', order: 5, color: 'bg-rose-100 text-rose-700', probability: 0 },
            ],
          },
        },
      },
      tags: {
        create: [
          { name: 'Enterprise', color: '#4f46e5' },
          { name: 'Hot', color: '#e11d48' },
        ],
      },
      integrations: {
        create: [
          { type: 'slack', name: 'Slack', enabled: false, config: {} },
          { type: 'zapier', name: 'Zapier', enabled: false, config: {} },
        ],
      },
    },
    include: { teams: true, pipelines: { include: { stages: true } }, tags: true },
  })

  const team = org.teams[0]!
  const pipeline = org.pipelines[0]!
  const negotiation = pipeline.stages.find((s) => s.key === 'negotiation')!

  const passwordHash = await bcrypt.hash('demo1234', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.local' },
    update: { passwordHash },
    create: {
      email: 'admin@crm.local',
      name: 'Admin User',
      passwordHash,
      preferences: { create: {} },
      memberships: {
        create: { organizationId: org.id, role: 'admin', teamId: team.id },
      },
    },
  })

  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@crm.local' },
    update: { passwordHash },
    create: {
      email: 'sarah@crm.local',
      name: 'Sarah Chen',
      passwordHash,
      preferences: { create: {} },
      memberships: {
        create: { organizationId: org.id, role: 'rep', teamId: team.id },
      },
    },
  })

  const company = await prisma.company.create({
    data: {
      organizationId: org.id,
      name: 'Acme Corp',
      industry: 'Technology',
      website: 'https://acme.example',
      ownerId: admin.id,
      healthScore: 82,
    },
  })

  const contact = await prisma.contact.create({
    data: {
      organizationId: org.id,
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@acme.example',
      companyId: company.id,
      title: 'VP Sales',
      ownerId: admin.id,
    },
  })

  const enterpriseTag = org.tags.find((t) => t.name === 'Enterprise')!

  await prisma.contact.update({
    where: { id: contact.id },
    data: { tags: { create: [{ tagId: enterpriseTag.id }] } },
  })

  const deal = await prisma.deal.create({
    data: {
      organizationId: org.id,
      title: 'Enterprise license renewal',
      value: 48000,
      stageKey: 'negotiation',
      pipelineId: pipeline.id,
      stageId: negotiation.id,
      contactId: contact.id,
      companyId: company.id,
      ownerId: admin.id,
      expectedClose: new Date('2026-05-30'),
      tags: { create: [{ tagId: enterpriseTag.id }] },
    },
  })

  const product = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Enterprise CRM License',
      sku: 'ENT-001',
      price: 12000,
    },
  })

  await prisma.quote.create({
    data: {
      organizationId: org.id,
      dealId: deal.id,
      title: 'Q2 renewal quote',
      status: 'sent',
      lines: [{ productId: product.id, quantity: 4, unitPrice: 12000 }],
    },
  })

  await prisma.customFieldDef.create({
    data: {
      organizationId: org.id,
      entityType: 'deal',
      label: 'Contract term (months)',
      type: 'number',
      options: [],
    },
  })

  const board = await prisma.board.create({
    data: {
      organizationId: org.id,
      name: 'Sales sprint',
      isPrivate: false,
      columns: {
        create: [
          { title: 'Backlog', order: 0 },
          { title: 'In progress', order: 1 },
          { title: 'Done', order: 2 },
        ],
      },
    },
    include: { columns: true },
  })

  const backlog = board.columns.find((c) => c.title === 'Backlog')!
  const inProgress = board.columns.find((c) => c.title === 'In progress')!

  await prisma.boardItem.createMany({
    data: [
      {
        boardId: board.id,
        columnId: backlog.id,
        title: 'Prep renewal deck',
        ownerId: admin.id,
        order: 0,
        recordType: 'deal',
        recordId: deal.id,
      },
      {
        boardId: board.id,
        columnId: inProgress.id,
        title: 'Legal review',
        ownerId: admin.id,
        order: 0,
        dueDate: new Date('2026-06-01'),
      },
    ],
  })

  await prisma.ticket.create({
    data: {
      organizationId: org.id,
      subject: 'SSO configuration help',
      description: 'Need assistance enabling SAML for Acme Corp.',
      status: 'open',
      priority: 'high',
      companyId: company.id,
      contactId: contact.id,
      assigneeId: admin.id,
      slaDue: new Date('2026-05-25'),
    },
  })

  await prisma.lead.create({
    data: {
      organizationId: org.id,
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'alex@startup.example',
      phone: '',
      company: 'Startup.io',
      stage: 'qualified',
      ownerId: admin.id,
      source: 'Website',
      utmSource: 'google',
      score: 65,
    },
  })

  await prisma.document.createMany({
    data: [
      {
        organizationId: org.id,
        title: 'Sales playbook',
        content:
          '## Qualification\n\n- BANT checklist\n- Discovery call script\n\n## Proposal\n\nUse the enterprise template and attach security FAQ.',
        recordType: null,
        recordId: null,
      },
      {
        organizationId: org.id,
        title: 'Acme Corp — account notes',
        content:
          'Primary contact: Jordan Lee.\nRenewal window: Q2.\nCompetitors: legacy vendor on month-to-month.',
        recordType: 'company',
        recordId: company.id,
      },
    ],
  })

  await prisma.automationRule.create({
    data: {
      organizationId: org.id,
      name: 'Proposal → legal task',
      enabled: true,
      trigger: { type: 'deal_stage_changed', stage: 'proposal' },
      actions: [{ type: 'notify', message: 'Deal entered proposal' }],
    },
  })

  await prisma.contract.create({
    data: {
      organizationId: org.id,
      dealId: deal.id,
      title: 'Enterprise MSA 2026',
      status: 'sent',
      signUrl: 'https://sign.example/msa-acme',
    },
  })

  await prisma.fileAttachment.create({
    data: {
      organizationId: org.id,
      recordType: 'deal',
      recordId: deal.id,
      name: 'renewal-proposal.pdf',
      size: 245_000,
      mimeType: 'application/pdf',
      storageKey: null,
    },
  })

  await prisma.campaign.create({
    data: {
      organizationId: org.id,
      name: 'Q2 Google Ads',
      utmSource: 'google',
      utmMedium: 'cpc',
      budget: 5000,
    },
  })

  await prisma.inboxMessage.create({
    data: {
      organizationId: org.id,
      teamId: team.id,
      from: 'jordan.lee@acme.example',
      subject: 'Re: Q2 renewal timeline',
      body: 'Hi team — can we confirm pricing before our board meeting on Friday? Thanks, Jordan',
      read: false,
      readByUserIds: [],
    },
  })

  await prisma.inboxMessage.create({
    data: {
      organizationId: org.id,
      teamId: team.id,
      senderId: admin.id,
      from: admin.name,
      subject: 'Pipeline review Thursday',
      body: 'Please update open deal stages before our 2pm sync.',
      readByUserIds: [],
    },
  })

  await prisma.inboxMessage.create({
    data: {
      organizationId: org.id,
      senderId: sarah.id,
      recipientUserId: admin.id,
      from: sarah.name,
      subject: 'Quick question on Acme',
      body: 'Can you take the intro call tomorrow? I am out until noon.',
      readByUserIds: [],
    },
  })

  console.log('Seed complete. Login: admin@crm.local / demo1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
