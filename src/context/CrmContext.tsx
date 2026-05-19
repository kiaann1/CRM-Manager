import type {
  Activity,
  AutomationRule,
  CalendarEvent,
  Comment,
  Company,
  Contact,
  Contract,
  CrmState,
  CustomFieldDef,
  Deal,
  DealStage,
  Document,
  Goal,
  EmailLog,
  FileAttachment,
  Lead,
  Quote,
  RecordType,
  Task,
  TaskStatus,
  Ticket,
  UserPreferences,
} from '../types'

export interface CrmContextValue extends CrmState {
  currentUser: CrmState['users'][0] | undefined
  login: (email: string, password: string) => boolean | Promise<boolean>
  logout: () => void | Promise<void>
  setPreferences: (prefs: Partial<UserPreferences>) => void
  resetDemoData: () => void
  patch: (updater: (prev: CrmState) => CrmState) => void
  addCompany: (data: Omit<Company, 'id' | 'createdAt'>) => void
  updateCompany: (id: string, data: Partial<Company>) => void
  deleteCompany: (id: string) => void
  addContact: (data: Omit<Contact, 'id' | 'createdAt'>) => void
  updateContact: (id: string, data: Partial<Contact>) => void
  deleteContact: (id: string) => void
  addLead: (data: Omit<Lead, 'id' | 'createdAt' | 'score'>) => void
  updateLead: (id: string, data: Partial<Lead>) => void
  convertLead: (id: string) => void
  deleteLead: (id: string) => void
  addDeal: (data: Omit<Deal, 'id' | 'createdAt'>) => void
  updateDeal: (id: string, data: Partial<Deal>) => void
  deleteDeal: (id: string) => void
  moveDeal: (id: string, stage: DealStage) => void
  addTask: (data: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, data: Partial<Task>) => void
  deleteTask: (id: string) => void
  setTaskStatus: (id: string, status: TaskStatus) => void
  addActivity: (data: Omit<Activity, 'id' | 'at'>) => void
  logEmail: (data: Omit<EmailLog, 'id' | 'sentAt'>) => void
  addCalendarEvent: (data: Omit<CalendarEvent, 'id'>) => void
  deleteCalendarEvent: (id: string) => void
  addGoal: (data: Omit<Goal, 'id'>) => void
  updateGoal: (id: string, data: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  addDocument: (data: Omit<Document, 'id' | 'updatedAt'>) => void
  updateDocument: (id: string, data: Partial<Document>) => void
  deleteDocument: (id: string) => void
  addQuote: (data: Omit<Quote, 'id' | 'createdAt'>) => void
  addContract: (data: Omit<Contract, 'id' | 'createdAt'>) => void
  addComment: (data: Omit<Comment, 'id' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  addTicket: (data: Omit<Ticket, 'id' | 'createdAt'>) => void
  updateTicket: (id: string, data: Partial<Ticket>) => void
  addAutomation: (data: Omit<AutomationRule, 'id'>) => void
  updateAutomation: (id: string, data: Partial<AutomationRule>) => void
  mergeContacts: (primaryId: string, duplicateId: string) => void
  setCustomField: (entityType: string, entityId: string, fieldId: string, value: unknown) => void
  addCustomFieldDef: (data: Omit<CustomFieldDef, 'id'>) => void
  importRows: (entity: 'contacts' | 'leads', rows: Record<string, string>[]) => void
  getCompany: (id: string) => Company | undefined
  getContact: (id: string) => Contact | undefined
  getDeal: (id: string) => Deal | undefined
  getLead: (id: string) => Lead | undefined
  getUser: (id: string) => CrmState['users'][0] | undefined
  getActivities: (recordType: RecordType, recordId: string) => Activity[]
  getComments: (recordType: RecordType, recordId: string) => Comment[]
  getFiles: (recordType: RecordType, recordId: string) => FileAttachment[]
}

export type { DealStage, TaskPriority, TaskStatus } from '../types'

export { CrmApiProvider as CrmProvider, useCrm } from './CrmProviderApi'
