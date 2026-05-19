import { Calendar, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import { formatDate } from '../lib/format'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import type { CalendarEvent, RecordType } from '../types'

type EventForm = Omit<CalendarEvent, 'id'>

function toDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultForm(userId: string): EventForm {
  const start = new Date()
  start.setHours(start.getHours() + 1, 0, 0, 0)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return {
    title: '',
    start: start.toISOString(),
    end: end.toISOString(),
    recordType: null,
    recordId: null,
    userId,
    externalSync: 'none',
  }
}

export function CalendarPage() {
  const {
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    session,
    contacts,
    deals,
    companies,
    currentUser,
  } = useCrm()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CalendarEvent | null>(null)
  const [form, setForm] = useState<EventForm>(() =>
    defaultForm(session?.userId ?? currentUser?.id ?? ''),
  )

  const userId = session?.userId ?? currentUser?.id ?? ''

  const recordOptions = [
    { value: '', label: 'No linked record' },
    ...contacts.map((c) => ({
      value: `contact:${c.id}`,
      label: `Contact — ${c.firstName} ${c.lastName}`,
    })),
    ...deals.map((d) => ({ value: `deal:${d.id}`, label: `Deal — ${d.title}` })),
    ...companies.map((c) => ({ value: `company:${c.id}`, label: `Company — ${c.name}` })),
  ]

  const openCreate = () => {
    setForm(defaultForm(userId))
    setModalOpen(true)
  }

  const parseRecord = (value: string) => {
    if (!value) return { recordType: null, recordId: null }
    const [type, id] = value.split(':') as [RecordType, string]
    return { recordType: type, recordId: id }
  }

  const recordValue =
    form.recordType && form.recordId ? `${form.recordType}:${form.recordId}` : ''

  const openEdit = (event: CalendarEvent) => {
    setEditing(event)
    setForm({
      title: event.title,
      start: event.start,
      end: event.end,
      recordType: event.recordType,
      recordId: event.recordId,
      userId: event.userId,
      externalSync: event.externalSync,
    })
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = { ...form, title: form.title.trim() }
    if (editing) {
      updateCalendarEvent(editing.id, payload)
      toast.success('Meeting updated')
    } else {
      addCalendarEvent(payload)
      toast.success('Meeting scheduled')
    }
    setModalOpen(false)
    setEditing(null)
  }

  const sorted = [...calendarEvents].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Schedule meetings and link them to CRM records"
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Add meeting
          </Button>
        }
      />
      <div className="page-shell">
        {sorted.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No meetings scheduled"
            description="Add a meeting to keep track of calls and demos with your accounts."
            action={
              <Button onClick={openCreate}>
                <Plus size={16} />
                Add meeting
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {sorted.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-4 list-item px-4 py-3"
              >
                <span>
                  <p className="font-medium text-text">{e.title}</p>
                  <p className="text-sm text-text-muted">
                    {formatDate(e.start)}
                    {e.end && ` — ${formatDate(e.end)}`}
                    {e.externalSync !== 'none' && ` · Sync: ${e.externalSync}`}
                  </p>
                </span>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    className="!p-2"
                    aria-label="Edit meeting"
                    onClick={() => openEdit(e)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    className="!p-2 text-rose-600"
                    aria-label="Delete meeting"
                    onClick={() =>
                      deleteConfirm(toast.askConfirm, e.title, () => {
                        deleteCalendarEvent(e.id)
                        toast.success('Meeting deleted')
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit meeting' : 'Schedule meeting'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="meeting-form">
              Save meeting
            </Button>
          </>
        }
      >
        <form id="meeting-form" className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Meeting title"
            required
            placeholder="e.g. Discovery call with Acme"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-text">Starts</span>
              <input
                type="datetime-local"
                required
                className="form-control"
                value={toDatetimeLocal(form.start)}
                onChange={(e) =>
                  setForm({ ...form, start: new Date(e.target.value).toISOString() })
                }
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-text">Ends</span>
              <input
                type="datetime-local"
                required
                className="form-control"
                value={toDatetimeLocal(form.end)}
                onChange={(e) =>
                  setForm({ ...form, end: new Date(e.target.value).toISOString() })
                }
              />
            </label>
          </div>
          <Select
            label="Link to record (optional)"
            value={recordValue}
            onChange={(e) => {
              const { recordType, recordId } = parseRecord(e.target.value)
              setForm({ ...form, recordType, recordId })
            }}
            options={recordOptions}
          />
          <Select
            label="Calendar sync"
            value={form.externalSync}
            onChange={(e) =>
              setForm({
                ...form,
                externalSync: e.target.value as CalendarEvent['externalSync'],
              })
            }
            options={[
              { value: 'none', label: 'CRM only (no sync)' },
              { value: 'google', label: 'Google Calendar (when connected)' },
              { value: 'outlook', label: 'Outlook (when connected)' },
            ]}
          />
        </form>
      </Modal>
    </>
  )
}
