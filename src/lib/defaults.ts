import type { CrmState } from '../types'
import { PIPE_DEFAULT, TEAM_CS, TEAM_SALES, TERRITORY_WEST, USER_ADMIN, USER_MARCUS, USER_SARAH, WS_MAIN } from './ids'

export const defaultState: CrmState = {
  version: 2,
  session: null,
  preferences: {
    theme: 'light',
    emailDigest: true,
    pushEnabled: true,
    currency: 'USD',
    locale: 'en-US',
    timezone: 'UTC',
  },
  productCatalogToken: null,
  users: [
    { id: USER_SARAH, name: 'Sarah Chen', email: 'sarah@crm.local', role: 'rep', teamId: TEAM_SALES, territoryId: TERRITORY_WEST },
    { id: USER_MARCUS, name: 'Marcus Webb', email: 'marcus@crm.local', role: 'manager', teamId: TEAM_SALES, territoryId: TERRITORY_WEST },
    { id: USER_ADMIN, name: 'Admin User', email: 'admin@crm.local', role: 'admin', teamId: TEAM_SALES, territoryId: null },
  ],
  workspaces: [{ id: WS_MAIN, name: 'Main workspace', isPrivate: false }],
  teams: [
    { id: TEAM_SALES, name: 'Sales', workspaceId: WS_MAIN },
    { id: TEAM_CS, name: 'Customer Success', workspaceId: WS_MAIN },
  ],
  territories: [{ id: TERRITORY_WEST, name: 'West', userIds: [USER_SARAH, USER_MARCUS] }],
  tags: [
    { id: 'tag-1', name: 'Enterprise', color: '#4f46e5' },
    { id: 'tag-2', name: 'Hot', color: '#e11d48' },
    { id: 'tag-3', name: 'Partner', color: '#0891b2' },
  ],
  companies: [
    {
      id: 'co-1', name: 'Acme Corp', industry: 'Technology', website: 'https://acme.example',
      phone: '+1 555 0100', parentId: null, ownerId: USER_SARAH, territoryId: TERRITORY_WEST,
      healthScore: 82, tagIds: ['tag-1'], createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'co-2', name: 'Northwind Traders', industry: 'Retail', website: 'https://northwind.example',
      phone: '+1 555 0200', parentId: null, ownerId: USER_MARCUS, territoryId: TERRITORY_WEST,
      healthScore: 64, tagIds: [], createdAt: '2026-02-01T10:00:00Z',
    },
  ],
  contacts: [
    {
      id: 'ct-1', firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@acme.example',
      phone: '+1 555 0101', companyId: 'co-1', title: 'VP Sales', ownerId: USER_SARAH,
      tagIds: ['tag-1'], leadId: null, createdAt: '2026-01-16T10:00:00Z',
    },
    {
      id: 'ct-2', firstName: 'Marcus', lastName: 'Webb', email: 'marcus@northwind.example',
      phone: '+1 555 0201', companyId: 'co-2', title: 'Director of Operations', ownerId: USER_MARCUS,
      tagIds: [], leadId: null, createdAt: '2026-02-02T10:00:00Z',
    },
    {
      id: 'ct-3', firstName: 'Elena', lastName: 'Rodriguez', email: 'elena.r@acme.example',
      phone: '+1 555 0102', companyId: 'co-1', title: 'Product Manager', ownerId: USER_SARAH,
      tagIds: ['tag-2'], leadId: null, createdAt: '2026-03-10T10:00:00Z',
    },
  ],
  leads: [
    {
      id: 'ld-1', firstName: 'Jordan', lastName: 'Lee', email: 'jordan@startup.io', phone: '+1 555 0300',
      company: 'Startup.io', stage: 'qualified', score: 72, ownerId: USER_SARAH, source: 'Website form',
      utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'q2-demo', convertedContactId: null,
      tagIds: ['tag-2'], createdAt: '2026-05-01T10:00:00Z',
    },
    {
      id: 'ld-2', firstName: 'Ava', lastName: 'Patel', email: 'ava@retailco.com', phone: '',
      company: 'RetailCo', stage: 'new', score: 35, ownerId: USER_MARCUS, source: 'Live chat',
      utmSource: 'direct', utmMedium: '', utmCampaign: '', convertedContactId: null,
      tagIds: [], createdAt: '2026-05-15T10:00:00Z',
    },
  ],
  pipelines: [{ id: PIPE_DEFAULT, name: 'Default sales pipeline', stageIds: ['ps-1', 'ps-2', 'ps-3', 'ps-4', 'ps-5', 'ps-6'] }],
  pipelineStages: [
    { id: 'ps-1', pipelineId: PIPE_DEFAULT, key: 'lead', label: 'Lead', order: 0, color: 'bg-slate-100 text-slate-700', probability: 10 },
    { id: 'ps-2', pipelineId: PIPE_DEFAULT, key: 'qualified', label: 'Qualified', order: 1, color: 'bg-sky-100 text-sky-700', probability: 25 },
    { id: 'ps-3', pipelineId: PIPE_DEFAULT, key: 'proposal', label: 'Proposal', order: 2, color: 'bg-violet-100 text-violet-700', probability: 50 },
    { id: 'ps-4', pipelineId: PIPE_DEFAULT, key: 'negotiation', label: 'Negotiation', order: 3, color: 'bg-amber-100 text-amber-800', probability: 75 },
    { id: 'ps-5', pipelineId: PIPE_DEFAULT, key: 'won', label: 'Won', order: 4, color: 'bg-emerald-100 text-emerald-700', probability: 100 },
    { id: 'ps-6', pipelineId: PIPE_DEFAULT, key: 'lost', label: 'Lost', order: 5, color: 'bg-rose-100 text-rose-700', probability: 0 },
  ],
  deals: [
    {
      id: 'dl-1', title: 'Enterprise license renewal', value: 48000, stage: 'negotiation', pipelineId: PIPE_DEFAULT,
      contactId: 'ct-1', companyId: 'co-1', ownerId: USER_SARAH, expectedClose: '2026-05-30',
      tagIds: ['tag-1'], slaDue: '2026-05-25T17:00:00Z', createdAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'dl-2', title: 'POS integration project', value: 22000, stage: 'proposal', pipelineId: PIPE_DEFAULT,
      contactId: 'ct-2', companyId: 'co-2', ownerId: USER_MARCUS, expectedClose: '2026-06-15',
      tagIds: [], slaDue: null, createdAt: '2026-04-01T10:00:00Z',
    },
    {
      id: 'dl-3', title: 'Pilot program — analytics', value: 8500, stage: 'qualified', pipelineId: PIPE_DEFAULT,
      contactId: 'ct-3', companyId: 'co-1', ownerId: USER_SARAH, expectedClose: '2026-05-20',
      tagIds: ['tag-2'], slaDue: null, createdAt: '2026-04-10T10:00:00Z',
    },
    {
      id: 'dl-4', title: 'Annual support package', value: 12000, stage: 'won', pipelineId: PIPE_DEFAULT,
      contactId: 'ct-1', companyId: 'co-1', ownerId: USER_SARAH, expectedClose: '2026-04-01',
      tagIds: [], slaDue: null, createdAt: '2026-02-15T10:00:00Z',
    },
  ],
  tasks: [
    {
      id: 'tk-1', title: 'Send revised contract', description: 'Include updated SLA terms from legal.',
      dueDate: '2026-05-20', priority: 'high', status: 'todo', contactId: 'ct-1', dealId: 'dl-1',
      ownerId: USER_SARAH, parentId: null, dependsOn: [], recurring: 'none', estimateMinutes: 60,
      loggedMinutes: 0, sprintId: 'sp-1', goalId: 'goal-1', checklist: [
        { id: 'cl-1', text: 'Legal review', done: true },
        { id: 'cl-2', text: 'Send PDF', done: false },
      ], tagIds: [], createdAt: '2026-05-10T10:00:00Z',
    },
    {
      id: 'tk-2', title: 'Schedule demo with Northwind', description: 'Walk through POS integration flow.',
      dueDate: '2026-05-22', priority: 'medium', status: 'in_progress', contactId: 'ct-2', dealId: 'dl-2',
      ownerId: USER_MARCUS, parentId: null, dependsOn: [], recurring: 'weekly', estimateMinutes: 30,
      loggedMinutes: 15, sprintId: 'sp-1', goalId: null, checklist: [], tagIds: [], createdAt: '2026-05-12T10:00:00Z',
    },
    {
      id: 'tk-3', title: 'Follow up on pilot feedback', description: '', dueDate: '2026-05-25',
      priority: 'low', status: 'todo', contactId: 'ct-3', dealId: 'dl-3', ownerId: USER_SARAH,
      parentId: null, dependsOn: ['tk-2'], recurring: 'none', estimateMinutes: 15, loggedMinutes: 0,
      sprintId: null, goalId: null, checklist: [], tagIds: [], createdAt: '2026-05-14T10:00:00Z',
    },
  ],
  activities: [
    { id: 'act-1', type: 'call', subject: 'Discovery call', body: 'Discussed renewal timeline.', recordType: 'deal', recordId: 'dl-1', userId: USER_SARAH, at: '2026-05-10T14:00:00Z' },
    { id: 'act-2', type: 'email', subject: 'Proposal sent', body: 'Attached pricing PDF.', recordType: 'deal', recordId: 'dl-2', userId: USER_MARCUS, at: '2026-05-12T09:00:00Z' },
    { id: 'act-3', type: 'meeting', subject: 'QBR', body: 'Quarterly business review with Acme.', recordType: 'company', recordId: 'co-1', userId: USER_SARAH, at: '2026-05-08T16:00:00Z' },
  ],
  emailLogs: [],
  calendarEvents: [
    { id: 'cal-1', title: 'Demo — Northwind', start: '2026-05-22T15:00:00Z', end: '2026-05-22T16:00:00Z', recordType: 'deal', recordId: 'dl-2', userId: USER_MARCUS, externalSync: 'google' },
  ],
  products: [
    {
      id: 'prod-1',
      name: 'CRM Pro Seat',
      sku: 'CRM-PRO',
      price: 99,
      description: 'Named user license for CRM Pro tier, annual billing.',
      category: 'Subscriptions',
      unitOfMeasure: 'seat',
      cost: 12,
      barcode: '0086019200001',
      imageUrl: '',
      status: 'active',
      specifications: [
        { name: 'Billing', value: 'Annual' },
        { name: 'Support', value: 'Business hours' },
      ],
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-01T10:00:00Z',
    },
    {
      id: 'prod-2',
      name: 'Implementation package',
      sku: 'SVC-IMPL',
      price: 5000,
      description: 'Fixed-scope onboarding: discovery, migration, training, go-live.',
      category: 'Services',
      unitOfMeasure: 'project',
      cost: 2200,
      barcode: '',
      imageUrl: '',
      status: 'active',
      specifications: [
        { name: 'Duration', value: '4–6 weeks' },
        { name: 'Includes', value: 'Dedicated consultant' },
      ],
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-01-01T10:00:00Z',
    },
  ],
  quotes: [
    {
      id: 'qt-1', dealId: 'dl-1', title: 'Renewal quote', status: 'sent',
      lines: [{ productId: 'prod-1', quantity: 50, unitPrice: 99 }, { productId: 'prod-2', quantity: 1, unitPrice: 5000 }],
      createdAt: '2026-05-01T10:00:00Z',
    },
  ],
  contracts: [
    { id: 'ctr-1', dealId: 'dl-4', title: 'Support MSA', status: 'signed', signUrl: 'https://sign.example/ctr-1', createdAt: '2026-03-01T10:00:00Z' },
  ],
  customFieldDefs: [
    { id: 'cf-1', entityType: 'deal', label: 'Discount %', type: 'number', options: [] },
    { id: 'cf-2', entityType: 'contact', label: 'LinkedIn', type: 'text', options: [] },
  ],
  customFieldValues: {
    deal: { 'dl-1': { 'cf-1': 10 } },
    contact: { 'ct-1': { 'cf-2': 'linkedin.com/in/sarahchen' } },
  },
  segments: [
    { id: 'seg-1', name: 'Hot leads', entityType: 'lead', tagId: 'tag-2', stage: null },
    { id: 'seg-2', name: 'Negotiation deals', entityType: 'deal', tagId: null, stage: 'negotiation' },
  ],
  boards: [
    { id: 'board-1', name: 'Sales pipeline board', workspaceId: WS_MAIN, columnIds: ['col-1', 'col-2', 'col-3'], isPrivate: false },
    { id: 'board-2', name: 'Customer onboarding', workspaceId: WS_MAIN, columnIds: ['col-4', 'col-5'], isPrivate: false },
  ],
  boardColumns: [
    { id: 'col-1', boardId: 'board-1', title: 'To do', order: 0 },
    { id: 'col-2', boardId: 'board-1', title: 'In progress', order: 1 },
    { id: 'col-3', boardId: 'board-1', title: 'Done', order: 2 },
    { id: 'col-4', boardId: 'board-2', title: 'Kickoff', order: 0 },
    { id: 'col-5', boardId: 'board-2', title: 'Live', order: 1 },
  ],
  boardItems: [
    { id: 'bi-1', boardId: 'board-1', columnId: 'col-2', title: 'Renewal follow-up', recordType: 'deal', recordId: 'dl-1', order: 0, dueDate: '2026-05-30', ownerId: USER_SARAH },
    { id: 'bi-2', boardId: 'board-2', columnId: 'col-4', title: 'Acme onboarding', recordType: 'company', recordId: 'co-1', order: 0, dueDate: null, ownerId: USER_SARAH },
  ],
  timeEntries: [
    { id: 'te-1', taskId: 'tk-2', userId: USER_MARCUS, minutes: 15, date: '2026-05-14', note: 'Prep demo slides' },
  ],
  goals: [
    { id: 'goal-1', title: 'Q2 revenue', target: 150000, current: 72000, quarter: '2026-Q2', ownerId: USER_SARAH },
  ],
  sprints: [
    { id: 'sp-1', name: 'Sprint 12', start: '2026-05-05', end: '2026-05-19', teamId: TEAM_SALES },
  ],
  documents: [
    { id: 'doc-1', title: 'Acme discovery notes', content: '# Discovery\n\nKey pain: reporting.', recordType: 'deal', recordId: 'dl-1', updatedAt: '2026-05-10T10:00:00Z' },
  ],
  files: [
    { id: 'file-1', recordType: 'deal', recordId: 'dl-1', name: 'proposal-v2.pdf', size: 245000, mimeType: 'application/pdf', uploadedAt: '2026-05-11T10:00:00Z' },
  ],
  automations: [
    {
      id: 'auto-1', name: 'Proposal → legal task', enabled: true,
      trigger: { type: 'deal_stage_changed', stage: 'proposal' },
      actions: [{ type: 'create_task', title: 'Legal review required' }, { type: 'notify', message: 'Deal entered proposal stage' }],
    },
  ],
  emailSequences: [
    {
      id: 'seq-1', name: 'Lead nurture', enabled: true,
      steps: [
        { delayDays: 0, subject: 'Welcome', body: 'Thanks for your interest.' },
        { delayDays: 3, subject: 'Case study', body: 'See how teams use CRM Manager.' },
      ],
    },
  ],
  webhooks: [{ id: 'wh-1', url: 'https://hooks.example/crm', events: ['deal.won'], enabled: true }],
  integrations: [
    { id: 'int-1', name: 'Slack', type: 'slack', enabled: true },
    { id: 'int-2', name: 'Microsoft Teams', type: 'teams', enabled: false },
    { id: 'int-3', name: 'Zapier', type: 'zapier', enabled: true },
  ],
  approvals: [
    { id: 'apr-1', dealId: 'dl-1', title: '20% discount approval', status: 'pending', requesterId: USER_SARAH, approverId: USER_MARCUS, createdAt: '2026-05-14T10:00:00Z' },
  ],
  comments: [
    { id: 'cmt-1', recordType: 'deal', recordId: 'dl-1', userId: USER_MARCUS, body: '@Sarah Chen can we expedite legal?', mentions: [USER_SARAH], createdAt: '2026-05-13T10:00:00Z' },
  ],
  notifications: [
    { id: 'n-1', userId: USER_SARAH, title: 'Approval pending', body: 'Discount approval needs your input.', read: false, createdAt: '2026-05-14T11:00:00Z' },
  ],
  inbox: [
    {
      id: 'in-1',
      teamId: TEAM_SALES,
      senderId: null,
      recipientUserId: null,
      from: 'support@acme.example',
      subject: 'Question about invoice',
      body: 'Can you clarify line 3?',
      read: false,
      receivedAt: '2026-05-15T08:00:00Z',
    },
  ],
  forms: [
    {
      id: 'form-1', name: 'Demo request',
      fields: [
        { id: 'f1', label: 'Email', type: 'email' },
        { id: 'f2', label: 'Company', type: 'text' },
      ],
      submissions: [{ id: 'sub-1', data: { f1: 'jordan@startup.io', f2: 'Startup.io' }, at: '2026-05-01T10:00:00Z' }],
    },
  ],
  campaigns: [
    { id: 'camp-1', name: 'Q2 Google Ads', utmSource: 'google', utmMedium: 'cpc', budget: 5000 },
  ],
  tickets: [
    {
      id: 'tkt-1', subject: 'Login issues', description: 'User cannot reset password.',
      status: 'open', priority: 'high', companyId: 'co-1', contactId: 'ct-1',
      assigneeId: USER_MARCUS, slaDue: '2026-05-20T17:00:00Z', createdAt: '2026-05-16T10:00:00Z',
    },
  ],
  surveys: [
    { id: 'sv-1', companyId: 'co-1', score: 9, feedback: 'Great support!', createdAt: '2026-05-01T10:00:00Z' },
  ],
  savedViews: [
    { id: 'svw-1', name: 'My open deals', entityType: 'deals', viewType: 'table', filters: { query: '', stage: 'proposal' }, shared: false },
  ],
  auditLog: [
    { id: 'aud-1', action: 'deal.updated', entityType: 'deal', entityId: 'dl-1', userId: USER_SARAH, at: '2026-05-14T10:00:00Z' },
  ],
}
