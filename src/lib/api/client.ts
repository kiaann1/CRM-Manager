import type { CrmState, InboxMessage, Product, ProductSpecification } from '../../types'

/** Empty string = same-origin (Vite proxy to API in dev) */
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Paths where 401 must not trigger refresh+retry (avoid loops / public auth). */
function shouldRetry401AfterRefresh(path: string): boolean {
  const p = path.split('?')[0]
  if (!p.startsWith('/api/')) return false
  if (p.startsWith('/api/public')) return false
  if (p.startsWith('/api/auth/')) {
    if (
      p === '/api/auth/login' ||
      p === '/api/auth/register' ||
      p === '/api/auth/logout' ||
      p === '/api/auth/refresh' ||
      p.startsWith('/api/auth/sso/')
    ) {
      return false
    }
    return true
  }
  return p.startsWith('/api/v1')
}

async function refreshAccessToken(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  return res.ok
}

async function request<T>(path: string, init?: RequestInit, alreadyRetried = false): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (res.status === 401 && !alreadyRetried && shouldRetry401AfterRefresh(path)) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return request<T>(path, init, true)
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(
      (body as { error?: string }).error ?? res.statusText,
      res.status,
      body,
    )
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  baseUrl: API_BASE,

  health: () => request<{ status: string }>('/health'),

  ssoProviders: () =>
    request<{ google: boolean; microsoft: boolean; oidc: boolean }>(
      '/api/auth/sso/providers',
    ),

  ssoStartUrl: (provider: 'google' | 'microsoft' | 'oidc') =>
    `${API_BASE}/api/auth/sso/${provider}`,

  register: (data: {
    email: string
    password: string
    name: string
    organizationName: string
  }) =>
    request<{ user: { id: string; email: string; name: string } }>(
      '/api/auth/register',
      { method: 'POST', body: JSON.stringify(data) },
    ),

  login: (email: string, password: string) =>
    request<{ user: { id: string; email: string; name: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    ),

  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  refresh: () => request<{ ok: boolean }>('/api/auth/refresh', { method: 'POST' }),

  me: () =>
    request<{
      user: { id: string; email: string; name: string }
      organizationId: string
      role: string
      hasPassword?: boolean
    }>('/api/auth/me'),

  updateProfile: (data: { name: string }) =>
    request<{ user: { id: string; email: string; name: string } }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ ok: boolean }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bootstrap: () => request<CrmState>('/api/v1/bootstrap'),

  createSavedView: (data: {
    entityType: 'contacts' | 'deals' | 'leads'
    name: string
    filters: { query?: string; stage?: string; minScore?: number }
    shared?: boolean
  }) =>
    request<{ id: string; name: string; entityType: string }>('/api/v1/saved-views', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteSavedView: (id: string) =>
    request<void>(`/api/v1/saved-views/${id}`, { method: 'DELETE' }),

  search: (q: string) =>
    request<{
      contacts: { id: string; firstName: string; lastName: string; email: string; title: string }[]
      companies: { id: string; name: string; industry: string }[]
      deals: { id: string; title: string; stageKey: string; value: number }[]
      leads: { id: string; firstName: string; lastName: string; email: string; company: string }[]
      documents: { id: string; title: string }[]
    }>(`/api/v1/search?q=${encodeURIComponent(q)}`),

  updatePreferences: (prefs: Partial<CrmState['preferences']>) =>
    request('/api/v1/preferences', { method: 'PATCH', body: JSON.stringify(prefs) }),

  createContact: (data: unknown) =>
    request('/api/v1/contacts', { method: 'POST', body: JSON.stringify(data) }),

  updateContact: (id: string, data: unknown) =>
    request(`/api/v1/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteContact: (id: string) =>
    request(`/api/v1/contacts/${id}`, { method: 'DELETE' }),

  deleteCompany: (id: string) =>
    request(`/api/v1/companies/${id}`, { method: 'DELETE' }),

  deleteLead: (id: string) =>
    request(`/api/v1/leads/${id}`, { method: 'DELETE' }),

  deleteDeal: (id: string) =>
    request(`/api/v1/deals/${id}`, { method: 'DELETE' }),

  deleteTask: (id: string) =>
    request(`/api/v1/tasks/${id}`, { method: 'DELETE' }),

  updateLead: (id: string, data: unknown) =>
    request(`/api/v1/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  convertLead: (id: string) =>
    request<{ contact: { id: string } }>(`/api/v1/leads/${id}/convert`, { method: 'POST' }),

  createDeal: (data: unknown) =>
    request('/api/v1/deals', { method: 'POST', body: JSON.stringify(data) }),

  updateDeal: (id: string, data: unknown) =>
    request(`/api/v1/deals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createActivity: (data: unknown) =>
    request('/api/v1/activities', { method: 'POST', body: JSON.stringify(data) }),

  createComment: (data: unknown) =>
    request('/api/v1/comments', { method: 'POST', body: JSON.stringify(data) }),

  createCompany: (data: unknown) =>
    request('/api/v1/companies', { method: 'POST', body: JSON.stringify(data) }),

  updateCompany: (id: string, data: unknown) =>
    request(`/api/v1/companies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createCalendarEvent: (data: unknown) =>
    request('/api/v1/calendar-events', { method: 'POST', body: JSON.stringify(data) }),

  deleteCalendarEvent: (id: string) =>
    request(`/api/v1/calendar-events/${id}`, { method: 'DELETE' }),

  createGoal: (data: unknown) =>
    request('/api/v1/goals', { method: 'POST', body: JSON.stringify(data) }),

  updateGoal: (id: string, data: unknown) =>
    request(`/api/v1/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteGoal: (id: string) =>
    request(`/api/v1/goals/${id}`, { method: 'DELETE' }),

  createSprint: (data: unknown) =>
    request('/api/v1/sprints', { method: 'POST', body: JSON.stringify(data) }),

  createDocument: (data: unknown) =>
    request('/api/v1/documents', { method: 'POST', body: JSON.stringify(data) }),

  updateDocument: (id: string, data: unknown) =>
    request(`/api/v1/documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteDocument: (id: string) =>
    request(`/api/v1/documents/${id}`, { method: 'DELETE' }),

  testWebhook: (id: string) =>
    request(`/api/v1/webhooks/${id}/test`, { method: 'POST' }),

  listIntegrations: () =>
    request<{
      catalog: unknown[]
      items: unknown[]
      sso: { google: boolean; microsoft: boolean }
    }>('/api/v1/integrations'),

  updateIntegration: (type: string, data: { enabled?: boolean; config?: Record<string, unknown> }) =>
    request(`/api/v1/integrations/${type}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  testIntegration: (type: string) =>
    request<{ ok: boolean; message: string }>(`/api/v1/integrations/${type}/test`, {
      method: 'POST',
    }),

  syncIntegration: (type: string) =>
    request<{ ok: boolean; message: string; synced?: number }>(
      `/api/v1/integrations/${type}/sync`,
      { method: 'POST' },
    ),

  listApiKeys: () =>
    request<
      { id: string; name: string; prefix: string; lastUsedAt: string | null; createdAt: string }[]
    >('/api/v1/api-keys'),

  createApiKey: (name: string) =>
    request<{ key: string; prefix: string; message: string }>('/api/v1/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  listWebhooks: () =>
    request<{ id: string; url: string; events: string[]; enabled: boolean }[]>('/api/v1/webhooks'),

  createWebhook: (data: { url: string; events: string[]; secret?: string }) =>
    request('/api/v1/webhooks', { method: 'POST', body: JSON.stringify(data) }),

  listInvites: () =>
    request<
      {
        id: string
        email: string
        role: string
        expiresAt: string
        createdAt: string
        invitedByName: string
      }[]
    >('/api/v1/invites'),

  createInvite: (data: { email: string; role: string }) =>
    request<{
      id: string
      email: string
      role: string
      expiresAt: string
      inviteUrl: string
    }>('/api/v1/invites', { method: 'POST', body: JSON.stringify(data) }),

  revokeInvite: (id: string) =>
    request(`/api/v1/invites/${id}`, { method: 'DELETE' }),

  getInvitePreview: (token: string) =>
    request<{
      organizationName: string
      email: string
      role: string
      existingUser: boolean
      expiresAt: string
    }>(`/api/auth/invite/${encodeURIComponent(token)}`),

  acceptInvite: (data: { token: string; name?: string; password?: string }) =>
    request<{ user: { id: string; email: string; name: string }; organizationId: string }>(
      '/api/auth/accept-invite',
      { method: 'POST', body: JSON.stringify(data) },
    ),

  updateTicket: (id: string, data: unknown) =>
    request(`/api/v1/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  updateAutomation: (id: string, data: { enabled: boolean }) =>
    request(`/api/v1/automations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  markNotificationRead: (id: string) =>
    request(`/api/v1/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<{ updated: number }>('/api/v1/notifications/read-all', { method: 'POST' }),

  createProduct: (data: {
    name: string
    sku: string
    price: number
    description?: string
    category?: string
    unitOfMeasure?: string
    cost?: number | null
    barcode?: string
    imageUrl?: string
    status?: 'active' | 'discontinued'
    specifications?: ProductSpecification[]
  }) => request<Product>('/api/v1/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: (
    id: string,
    data: Partial<{
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
    }>,
  ) => request<Product>(`/api/v1/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteProduct: (id: string) =>
    request<void>(`/api/v1/products/${id}`, { method: 'DELETE' }),

  createProductCatalogFeed: () =>
    request<{ token: string; url: string }>('/api/v1/product-catalog-feed', { method: 'POST' }),

  deleteProductCatalogFeed: () =>
    request<void>('/api/v1/product-catalog-feed', { method: 'DELETE' }),

  createContract: (data: {
    dealId: string
    title: string
    status?: string
    signUrl?: string
  }) => request('/api/v1/contracts', { method: 'POST', body: JSON.stringify(data) }),

  updateContract: (
    id: string,
    data: Partial<{ title: string; status: string; signUrl: string }>,
  ) => request(`/api/v1/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  uploadFile: (data: {
    recordType: string
    recordId: string
    name: string
    size: number
    mimeType: string
    storageKey?: string
  }) => request('/api/v1/files', { method: 'POST', body: JSON.stringify(data) }),

  deleteFile: (id: string) => request(`/api/v1/files/${id}`, { method: 'DELETE' }),

  sendInboxMessage: (data: {
    subject: string
    body: string
    teamId?: string
    recipientUserId?: string
  }) =>
    request<InboxMessage>('/api/v1/inbox', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markInboxRead: (id: string) =>
    request(`/api/v1/inbox/${id}/read`, { method: 'PATCH' }),

  mergeContacts: (primaryId: string, duplicateId: string) =>
    request('/api/v1/contacts/merge', {
      method: 'POST',
      body: JSON.stringify({ primaryId, duplicateId }),
    }),

  importContacts: (rows: Record<string, string>[]) =>
    request<{ created: number }>('/api/v1/contacts/import', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    }),

  importLeads: (rows: Record<string, string>[]) =>
    request<{ created: number }>('/api/v1/leads/import', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    }),

  createTag: (data: { name: string; color?: string }) =>
    request('/api/v1/tags', { method: 'POST', body: JSON.stringify(data) }),

  createQuote: (data: unknown) =>
    request('/api/v1/quotes', { method: 'POST', body: JSON.stringify(data) }),

  updateQuote: (id: string, data: unknown) =>
    request(`/api/v1/quotes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteQuote: (id: string) => request(`/api/v1/quotes/${id}`, { method: 'DELETE' }),

  createAutomation: (data: unknown) =>
    request('/api/v1/automations', { method: 'POST', body: JSON.stringify(data) }),

  deleteAutomation: (id: string) =>
    request(`/api/v1/automations/${id}`, { method: 'DELETE' }),

  updatePipelineStage: (
    id: string,
    data: Partial<{ label: string; probability: number; color: string }>,
  ) =>
    request(`/api/v1/pipeline-stages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createCampaign: (data: {
    name: string
    utmSource?: string
    utmMedium?: string
    budget?: number
  }) => request('/api/v1/campaigns', { method: 'POST', body: JSON.stringify(data) }),

  updateCampaign: (
    id: string,
    data: Partial<{ name: string; utmSource: string; utmMedium: string; budget: number }>,
  ) => request(`/api/v1/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteCampaign: (id: string) => request(`/api/v1/campaigns/${id}`, { method: 'DELETE' }),

  createBoard: (data: { name: string }) =>
    request('/api/v1/boards', { method: 'POST', body: JSON.stringify(data) }),

  createApproval: (data: { dealId: string; title: string; approverId: string }) =>
    request('/api/v1/approvals', { method: 'POST', body: JSON.stringify(data) }),

  updateApproval: (id: string, data: { status: 'approved' | 'rejected' }) =>
    request(`/api/v1/approvals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createSurvey: (data: { companyId: string; score: number; feedback?: string }) =>
    request('/api/v1/surveys', { method: 'POST', body: JSON.stringify(data) }),

  logTimeEntry: (data: { taskId: string; minutes: number; note?: string }) =>
    request('/api/v1/time-entries', { method: 'POST', body: JSON.stringify(data) }),

  updateCalendarEvent: (id: string, data: unknown) =>
    request(`/api/v1/calendar-events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createCustomFieldDef: (data: unknown) =>
    request('/api/v1/custom-field-defs', { method: 'POST', body: JSON.stringify(data) }),

  setCustomFieldValue: (data: { fieldId: string; entityId: string; value: unknown }) =>
    request('/api/v1/custom-field-values', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createTicket: (data: unknown) =>
    request('/api/v1/tickets', { method: 'POST', body: JSON.stringify(data) }),

  createBoardItem: (data: unknown) =>
    request('/api/v1/board-items', { method: 'POST', body: JSON.stringify(data) }),

  updateBoardItem: (id: string, data: unknown) =>
    request(`/api/v1/board-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteBoardItem: (id: string) =>
    request(`/api/v1/board-items/${id}`, { method: 'DELETE' }),

  openapi: () => request('/api/v1/openapi'),
}
