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

  await prisma.user.upsert({
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

  await prisma.deal.create({
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

  console.log('Seed complete. Login: admin@crm.local / demo1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
