export type DealStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'

export type LeadStage = 'new' | 'contacted' | 'qualified' | 'converted' | 'disqualified'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type ActivityType = 'call' | 'email' | 'meeting' | 'note'
export type RecordType =
  | 'contact'
  | 'company'
  | 'deal'
  | 'lead'
  | 'task'
  | 'ticket'
  | 'board_item'
export type CustomFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'user'
  | 'relation'
  | 'formula'
export type ViewType = 'table' | 'board' | 'calendar' | 'timeline' | 'gallery'
export type UserRole = 'admin' | 'manager' | 'rep' | 'guest' | 'readonly'
export type ThemeMode = 'light' | 'dark'
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'void'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  teamId: string
  territoryId: string | null
  avatar?: string
}

export interface Team {
  id: string
  name: string
  workspaceId: string
}

export interface Workspace {
  id: string
  name: string
  isPrivate: boolean
}

export interface Territory {
  id: string
  name: string
  userIds: string[]
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Company {
  id: string
  name: string
  industry: string
  website: string
  phone: string
  parentId: string | null
  ownerId: string
  territoryId: string | null
  healthScore: number
  tagIds: string[]
  createdAt: string
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  companyId: string | null
  title: string
  ownerId: string
  tagIds: string[]
  leadId: string | null
  createdAt: string
}

export interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  stage: LeadStage
  score: number
  ownerId: string
  source: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  convertedContactId: string | null
  tagIds: string[]
  createdAt: string
}

export interface Pipeline {
  id: string
  name: string
  stageIds: string[]
}

export interface PipelineStageConfig {
  id: string
  pipelineId: string
  key: DealStage
  label: string
  order: number
  color: string
  probability: number
}

export interface Deal {
  id: string
  title: string
  value: number
  stage: DealStage
  pipelineId: string
  contactId: string | null
  companyId: string | null
  ownerId: string
  expectedClose: string
  tagIds: string[]
  slaDue: string | null
  createdAt: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  priority: TaskPriority
  status: TaskStatus
  contactId: string | null
  dealId: string | null
  ownerId: string
  parentId: string | null
  dependsOn: string[]
  recurring: 'none' | 'weekly' | 'monthly'
  estimateMinutes: number
  loggedMinutes: number
  sprintId: string | null
  goalId: string | null
  checklist: ChecklistItem[]
  tagIds: string[]
  createdAt: string
}

export interface Activity {
  id: string
  type: ActivityType
  subject: string
  body: string
  recordType: RecordType
  recordId: string
  userId: string
  at: string
}

export interface EmailLog {
  id: string
  recordType: RecordType
  recordId: string
  to: string
  subject: string
  body: string
  userId: string
  sentAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  recordType: RecordType | null
  recordId: string | null
  userId: string
  externalSync: 'none' | 'google' | 'outlook'
}

export type ProductSpecification = { name: string; value: string }

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  description: string
  category: string
  unitOfMeasure: string
  cost: number | null
  barcode: string
  imageUrl: string
  status: 'active' | 'discontinued'
  specifications: ProductSpecification[]
  createdAt: string
  updatedAt: string
}

export interface QuoteLine {
  productId: string
  quantity: number
  unitPrice: number
}

export interface Quote {
  id: string
  dealId: string
  title: string
  lines: QuoteLine[]
  status: QuoteStatus
  createdAt: string
}

export interface Contract {
  id: string
  dealId: string
  title: string
  status: ContractStatus
  signUrl: string
  createdAt: string
}

export interface CustomFieldDef {
  id: string
  entityType: RecordType | 'lead'
  label: string
  type: CustomFieldType
  options: string[]
  formula?: string
}

export interface Segment {
  id: string
  name: string
  entityType: 'contact' | 'deal' | 'lead'
  tagId: string | null
  stage: string | null
}

export interface Board {
  id: string
  name: string
  workspaceId: string
  columnIds: string[]
  isPrivate: boolean
}

export interface BoardColumn {
  id: string
  boardId: string
  title: string
  order: number
}

export interface BoardItem {
  id: string
  boardId: string
  columnId: string
  title: string
  recordType: RecordType | null
  recordId: string | null
  order: number
  dueDate: string | null
  ownerId: string
}

export interface TimeEntry {
  id: string
  taskId: string
  userId: string
  minutes: number
  date: string
  note: string
}

export interface Goal {
  id: string
  title: string
  target: number
  current: number
  quarter: string
  ownerId: string
}

export interface Sprint {
  id: string
  name: string
  start: string
  end: string
  teamId: string
}

export interface Document {
  id: string
  title: string
  content: string
  recordType: RecordType | null
  recordId: string | null
  updatedAt: string
}

export interface FileAttachment {
  id: string
  recordType: RecordType
  recordId: string
  name: string
  size: number
  mimeType: string
  storageKey?: string | null
  uploadedAt: string
}

export type AutomationTrigger =
  | { type: 'record_created'; entity: string }
  | { type: 'field_changed'; entity: string; field: string }
  | { type: 'deal_stage_changed'; stage: DealStage }
  | { type: 'scheduled'; cron: string }

export type AutomationAction =
  | { type: 'create_task'; title: string }
  | { type: 'notify'; message: string }
  | { type: 'set_field'; field: string; value: string }
  | { type: 'webhook'; url: string }

export interface AutomationRule {
  id: string
  name: string
  enabled: boolean
  trigger: AutomationTrigger
  actions: AutomationAction[]
}

export interface EmailSequence {
  id: string
  name: string
  steps: { delayDays: number; subject: string; body: string }[]
  enabled: boolean
}

export interface WebhookConfig {
  id: string
  url: string
  events: string[]
  enabled: boolean
}

export type IntegrationType =
  | 'slack'
  | 'teams'
  | 'gmail'
  | 'outlook'
  | 'zapier'
  | 'make'
  | 'hubspot'
  | 'stripe'

export type IntegrationCategory = 'communication' | 'calendar' | 'automation' | 'crm' | 'billing'

export interface IntegrationFieldDef {
  key: string
  label: string
  type: 'text' | 'password' | 'url'
  placeholder?: string
  required?: boolean
}

export interface Integration {
  id: string
  name: string
  type: IntegrationType | string
  description?: string
  category?: IntegrationCategory | string
  enabled: boolean
  config?: Record<string, unknown>
  fields?: IntegrationFieldDef[]
  docsUrl?: string
  ssoProvider?: 'google' | 'microsoft'
  ssoAvailable?: boolean
  connected?: boolean
  lastSyncAt?: string | null
  lastTestAt?: string | null
  lastTestOk?: boolean | null
}

export interface Approval {
  id: string
  dealId: string
  title: string
  status: ApprovalStatus
  requesterId: string
  approverId: string
  createdAt: string
}

export interface Comment {
  id: string
  recordType: RecordType
  recordId: string
  userId: string
  body: string
  mentions: string[]
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface InboxMessage {
  id: string
  teamId: string | null
  senderId: string | null
  recipientUserId: string | null
  from: string
  subject: string
  body: string
  read: boolean
  receivedAt: string
}

export interface MarketingForm {
  id: string
  name: string
  fields: { id: string; label: string; type: string }[]
  submissions: { id: string; data: Record<string, string>; at: string }[]
}

export interface Campaign {
  id: string
  name: string
  utmSource: string
  utmMedium: string
  budget: number
}

export interface Ticket {
  id: string
  subject: string
  description: string
  status: TicketStatus
  priority: TaskPriority
  companyId: string | null
  contactId: string | null
  assigneeId: string
  slaDue: string | null
  createdAt: string
}

export interface Survey {
  id: string
  companyId: string
  score: number
  feedback: string
  createdAt: string
}

export interface SavedView {
  id: string
  name: string
  entityType: string
  viewType: ViewType
  filters: Record<string, string>
  shared: boolean
}

export interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  userId: string
  at: string
}

export interface UserPreferences {
  theme: ThemeMode
  emailDigest: boolean
  pushEnabled: boolean
  /** ISO 4217 currency code (e.g. USD, EUR). */
  currency: string
  /** BCP 47 locale for dates and numbers (e.g. en-GB). */
  locale: string
  /** IANA time zone for displaying dates (e.g. America/New_York). */
  timezone: string
}

export interface AuthSession {
  userId: string
  email: string
  loggedInAt: string
}

export interface CrmState {
  version: number
  session: AuthSession | null
  preferences: UserPreferences
  /** Read-only storefront feed; set via Products → Catalog API. */
  productCatalogToken: string | null
  users: User[]
  workspaces: Workspace[]
  teams: Team[]
  territories: Territory[]
  tags: Tag[]
  companies: Company[]
  contacts: Contact[]
  leads: Lead[]
  pipelines: Pipeline[]
  pipelineStages: PipelineStageConfig[]
  deals: Deal[]
  tasks: Task[]
  activities: Activity[]
  emailLogs: EmailLog[]
  calendarEvents: CalendarEvent[]
  products: Product[]
  quotes: Quote[]
  contracts: Contract[]
  customFieldDefs: CustomFieldDef[]
  customFieldValues: Record<string, Record<string, Record<string, unknown>>>
  segments: Segment[]
  boards: Board[]
  boardColumns: BoardColumn[]
  boardItems: BoardItem[]
  timeEntries: TimeEntry[]
  goals: Goal[]
  sprints: Sprint[]
  documents: Document[]
  files: FileAttachment[]
  automations: AutomationRule[]
  emailSequences: EmailSequence[]
  webhooks: WebhookConfig[]
  integrations: Integration[]
  approvals: Approval[]
  comments: Comment[]
  notifications: Notification[]
  inbox: InboxMessage[]
  forms: MarketingForm[]
  campaigns: Campaign[]
  tickets: Ticket[]
  surveys: Survey[]
  savedViews: SavedView[]
  auditLog: AuditLogEntry[]
}
