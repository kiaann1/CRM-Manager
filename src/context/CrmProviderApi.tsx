/**
 * API-backed CRM provider. Replaces localStorage persistence with REST + cookies.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError } from '../lib/api/client'
import { defaultState } from '../lib/storage'
import { normalizeTheme } from '../lib/theme'
import type { CrmState, DealStage, TaskStatus, UserPreferences } from '../types'
import { WorkspaceLoader } from '../components/layout/WorkspaceLoader'
import type { CrmContextValue } from './CrmContext'

const CrmApiContext = createContext<CrmContextValue | null>(null)

export function CrmApiProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CrmState>({ ...defaultState, session: null })
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const data = await api.bootstrap()
    setState({
      ...data,
      preferences: {
        ...data.preferences,
        theme: normalizeTheme(data.preferences.theme),
      },
    })
    return data
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        await api.refresh().catch(() => undefined)
        await reload()
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) {
          console.error('Bootstrap failed', e)
        }
        setState((s) => ({ ...s, session: null }))
      } finally {
        setLoading(false)
      }
    })()
  }, [reload])

  useEffect(() => {
    const root = document.documentElement
    const dark = normalizeTheme(state.preferences.theme) === 'dark'
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
  }, [state.preferences.theme])

  const login = useCallback(async (email: string, password: string) => {
    await api.login(email, password)
    try {
      await reload()
    } catch (e) {
      await api.logout().catch(() => undefined)
      throw new Error(
        e instanceof Error
          ? `Signed in but workspace failed to load: ${e.message}`
          : 'Signed in but workspace failed to load. Try npm run db:push --prefix server',
      )
    }
  }, [reload])

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined)
    setState((s) => ({ ...s, session: null }))
  }, [])

  const setPreferences = useCallback(
    async (prefs: Partial<UserPreferences>) => {
      const patch = { ...prefs }
      if (patch.theme !== undefined) {
        patch.theme = normalizeTheme(patch.theme)
      }
      await api.updatePreferences(patch)
      setState((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, ...patch },
      }))
    },
    [],
  )

  const resetDemoData = useCallback(() => {
    window.location.reload()
  }, [])

  const patch = useCallback((updater: (prev: CrmState) => CrmState) => {
    setState(updater)
  }, [])

  const uid = state.session?.userId ?? ''

  const after = useCallback(
    async (fn: () => Promise<unknown>) => {
      await fn()
      await reload()
    },
    [reload],
  )

  const value = useMemo<CrmContextValue>(() => {
    const getters = {
      getCompany: (id: string) => state.companies.find((c) => c.id === id),
      getContact: (id: string) => state.contacts.find((c) => c.id === id),
      getDeal: (id: string) => state.deals.find((d) => d.id === id),
      getLead: (id: string) => state.leads.find((l) => l.id === id),
      getUser: (id: string) => state.users.find((u) => u.id === id),
      getActivities: (recordType: import('../types').RecordType, recordId: string) =>
        state.activities.filter(
          (a) => a.recordType === recordType && a.recordId === recordId,
        ),
      getComments: (recordType: import('../types').RecordType, recordId: string) =>
        state.comments.filter(
          (c) => c.recordType === recordType && c.recordId === recordId,
        ),
      getFiles: (recordType: import('../types').RecordType, recordId: string) =>
        state.files.filter(
          (f) => f.recordType === recordType && f.recordId === recordId,
        ),
    }

    return {
      ...state,
      currentUser: state.users.find((u) => u.id === state.session?.userId),
      login,
      logout,
      setPreferences,
      resetDemoData,
      patch,
      refreshWorkspace: async () => {
        await reload()
      },
      addCompany: (data) => {
        void after(() => api.createCompany(data))
      },
      updateCompany: (id, data) => {
        void after(() => api.updateCompany(id, data))
      },
      deleteCompany: (id) => {
        void after(() => api.deleteCompany(id))
      },
      addContact: (data) => {
        void after(() => api.createContact(data))
      },
      updateContact: (id, data) => {
        void after(() => api.updateContact(id, data))
      },
      deleteContact: (id) => {
        void after(() => api.deleteContact(id))
      },
      addLead: (data) => {
        void after(() =>
          fetch(`${api.baseUrl}/api/v1/leads`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          }),
        )
      },
      updateLead: (id, data) => {
        void after(() => api.updateLead(id, data))
      },
      convertLead: (id) => after(() => api.convertLead(id)),
      deleteLead: (id) => {
        void after(() => api.deleteLead(id))
      },
      addDeal: (data) => {
        void after(() =>
          api.createDeal({
            ...data,
            stageKey: data.stage,
          }),
        )
      },
      updateDeal: (id, data) => {
        void after(() =>
          api.updateDeal(id, {
            ...data,
            stageKey: data.stage,
          }),
        )
      },
      deleteDeal: (id) => {
        void after(() => api.deleteDeal(id))
      },
      moveDeal: (id, stage: DealStage) => {
        void after(() => api.updateDeal(id, { stageKey: stage }))
      },
      addTask: (data) => {
        void after(() =>
          fetch(`${api.baseUrl}/api/v1/tasks`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          }),
        )
      },
      updateTask: (id, data) => {
        void after(() =>
          fetch(`${api.baseUrl}/api/v1/tasks/${id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          }),
        )
      },
      deleteTask: (id) => {
        void after(() => api.deleteTask(id))
      },
      setTaskStatus: (id, status: TaskStatus) => {
        void after(() =>
          fetch(`${api.baseUrl}/api/v1/tasks/${id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          }),
        )
      },
      addActivity: (data) => {
        void after(() => api.createActivity(data))
      },
      logEmail: (data) => {
        void after(() =>
          api.createActivity({
            type: 'email',
            subject: data.subject,
            body: data.body,
            recordType: data.recordType,
            recordId: data.recordId,
          }),
        )
      },
      addCalendarEvent: (data) => {
        void after(() => api.createCalendarEvent(data))
      },
      updateCalendarEvent: (id, data) => {
        void after(() => api.updateCalendarEvent(id, data))
      },
      deleteCalendarEvent: (id) => {
        void after(() => api.deleteCalendarEvent(id))
      },
      addGoal: (data) => {
        void after(() => api.createGoal(data))
      },
      updateGoal: (id, data) => {
        void after(() => api.updateGoal(id, data))
      },
      deleteGoal: (id) => {
        void after(() => api.deleteGoal(id))
      },
      addSprint: (data) => {
        void after(() => api.createSprint(data))
      },
      addDocument: (data) => {
        void after(() => api.createDocument(data))
      },
      updateDocument: (id, data) => {
        void after(() => api.updateDocument(id, data))
      },
      deleteDocument: (id) => {
        void after(() => api.deleteDocument(id))
      },
      addQuote: (data) => {
        void after(() => api.createQuote(data))
      },
      updateQuote: (id, data) => {
        void after(() => api.updateQuote(id, data))
      },
      deleteQuote: (id) => {
        void after(() => api.deleteQuote(id))
      },
      addCampaign: (data) => {
        void after(() => api.createCampaign(data))
      },
      updateCampaign: (id, data) => {
        void after(() => api.updateCampaign(id, data))
      },
      deleteCampaign: (id) => {
        void after(() => api.deleteCampaign(id))
      },
      updatePipelineStage: (id, data) => {
        void after(() => api.updatePipelineStage(id, data))
      },
      addProduct: (data) => {
        void after(() => api.createProduct(data))
      },
      updateProduct: (id, data) => {
        void after(() => api.updateProduct(id, data))
      },
      deleteProduct: (id) => {
        void after(() => api.deleteProduct(id))
      },
      createBoard: (name) => {
        void after(() => api.createBoard({ name }))
      },
      addBoardItem: (data) => {
        void after(() => api.createBoardItem(data))
      },
      moveBoardItem: (id, columnId) => {
        void after(() => api.updateBoardItem(id, { columnId }))
      },
      deleteBoardItem: (id) => {
        void after(() => api.deleteBoardItem(id))
      },
      requestApproval: (data) => {
        void after(() => api.createApproval(data))
      },
      respondApproval: (id, status) => {
        void after(() => api.updateApproval(id, { status }))
      },
      addSurvey: (data) => {
        void after(() => api.createSurvey(data))
      },
      logTime: (taskId, minutes, note) => {
        void after(() => api.logTimeEntry({ taskId, minutes, note }))
      },
      createTag: (name, color) => {
        void after(() => api.createTag({ name, color }))
      },
      addContract: (data) => {
        void after(() => api.createContract(data))
      },
      updateContract: (id, data) => {
        void after(() => api.updateContract(id, data))
      },
      uploadFile: (data) => {
        void after(() =>
          api.uploadFile({
            ...data,
            storageKey: data.storageKey ?? undefined,
          }),
        )
      },
      deleteFile: (id) => {
        void after(() => api.deleteFile(id))
      },
      sendInboxMessage: (data) => after(() => api.sendInboxMessage(data)),
      markInboxRead: (id) => after(() => api.markInboxRead(id)),
      markAllNotificationsRead: () => {
        void after(() => api.markAllNotificationsRead())
      },
      addComment: (data) => {
        void after(() => api.createComment(data))
      },
      markNotificationRead: (id) => {
        void after(async () => {
          await api.markNotificationRead(id)
        })
      },
      addTicket: (data) => {
        void after(() => api.createTicket(data))
      },
      updateTicket: (id, data) => {
        void after(() => api.updateTicket(id, data))
      },
      addAutomation: (data) => {
        void after(() => api.createAutomation(data))
      },
      updateAutomation: (id, data) => {
        const enabled = data.enabled
        if (enabled === undefined) return
        void after(() => api.updateAutomation(id, { enabled }))
      },
      deleteAutomation: (id) => {
        void after(() => api.deleteAutomation(id))
      },
      mergeContacts: (primaryId, duplicateId) => {
        void after(() => api.mergeContacts(primaryId, duplicateId))
      },
      setCustomField: (_entityType, entityId, fieldId, value) => {
        void after(async () => {
          await api.setCustomFieldValue({ fieldId, entityId, value })
        })
      },
      addCustomFieldDef: (data) => {
        void after(() => api.createCustomFieldDef(data))
      },
      importRows: (entity, rows) => {
        void after(async () => {
          if (entity === 'contacts') {
            await api.importContacts(
              rows.map((r) => ({
                firstName: r.firstName ?? r.firstname ?? 'Unknown',
                lastName: r.lastName ?? r.lastname ?? '',
                email: r.email ?? '',
                phone: r.phone ?? '',
                title: r.title ?? '',
              })),
            )
          } else {
            await api.importLeads(
              rows.map((r) => ({
                firstName: r.firstName ?? r.firstname ?? 'Unknown',
                lastName: r.lastName ?? r.lastname ?? '',
                email: r.email ?? '',
                company: r.company ?? '',
                phone: r.phone ?? '',
              })),
            )
          }
        })
      },
      ...getters,
    }
  }, [state, login, logout, setPreferences, resetDemoData, patch, after, reload, uid])

  if (loading) {
    return <WorkspaceLoader />
  }

  return <CrmApiContext.Provider value={value}>{children}</CrmApiContext.Provider>
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmApiContext)
  if (!ctx) throw new Error('useCrm must be used within CrmApiProvider')
  return ctx
}

export { CrmApiProvider as CrmProvider }
