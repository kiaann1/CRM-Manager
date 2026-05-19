import type { CrmState } from '../../types'

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
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
    }>('/api/auth/me'),

  bootstrap: () => request<CrmState>('/api/v1/bootstrap'),

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

  createDocument: (data: unknown) =>
    request('/api/v1/documents', { method: 'POST', body: JSON.stringify(data) }),

  updateDocument: (id: string, data: unknown) =>
    request(`/api/v1/documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteDocument: (id: string) =>
    request(`/api/v1/documents/${id}`, { method: 'DELETE' }),

  testWebhook: (id: string) =>
    request(`/api/v1/webhooks/${id}/test`, { method: 'POST' }),

  updateIntegration: (type: string, data: { enabled: boolean; config?: object }) =>
    request(`/api/v1/integrations/${type}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

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

  openapi: () => request('/api/v1/openapi'),
}
