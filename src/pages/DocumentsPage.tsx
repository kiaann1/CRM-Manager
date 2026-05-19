import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import { formatDate } from '../lib/format'
import type { Document, RecordType } from '../types'

type DocForm = Omit<Document, 'id' | 'updatedAt'>

const RECORD_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'General (no link)' },
  { value: 'contact', label: 'Contact' },
  { value: 'company', label: 'Company' },
  { value: 'deal', label: 'Deal' },
  { value: 'lead', label: 'Lead' },
  { value: 'task', label: 'Task' },
]

function emptyDoc(): DocForm {
  return { title: '', content: '', recordType: null, recordId: null }
}

export function DocumentsPage() {
  const { documents, contacts, companies, deals, leads, tasks, addDocument, updateDocument, deleteDocument } =
    useCrm()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Document | null>(null)
  const [form, setForm] = useState<DocForm>(emptyDoc)
  const [viewId, setViewId] = useState<string | null>(null)

  const viewing = viewId ? documents.find((d) => d.id === viewId) : null

  const recordOptionsForType = (type: RecordType | null) => {
    if (!type) return []
    if (type === 'contact') return contacts.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))
    if (type === 'company') return companies.map((c) => ({ value: c.id, label: c.name }))
    if (type === 'deal') return deals.map((d) => ({ value: d.id, label: d.title }))
    if (type === 'lead') return leads.map((l) => ({ value: l.id, label: `${l.firstName} ${l.lastName}` }))
    if (type === 'task') return tasks.map((t) => ({ value: t.id, label: t.title }))
    return []
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyDoc())
    setModalOpen(true)
  }

  const openEdit = (doc: Document) => {
    setEditing(doc)
    setForm({
      title: doc.title,
      content: doc.content,
      recordType: doc.recordType,
      recordId: doc.recordId,
    })
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = {
      ...form,
      title: form.title.trim(),
      recordType: form.recordType || null,
      recordId: form.recordType && form.recordId ? form.recordId : null,
    }
    if (editing) {
      updateDocument(editing.id, payload)
      toast.success('Document updated')
    } else {
      addDocument(payload)
      toast.success('Document created')
    }
    setModalOpen(false)
  }

  return (
    <>
      <PageHeader
        title="Docs"
        description="Wiki-style documents linked to CRM records"
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-1 inline" />
            New doc
          </Button>
        }
      />

      {documents.length === 0 ? (
        <div className="p-8">
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Create playbooks, account notes, and runbooks for your team."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} className="mr-1 inline" />
              Create document
            </Button>
          }
        />
        </div>
      ) : (
        <ul className="grid gap-4 p-8 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex flex-col rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900"
            >
              <FileText className="mb-2 text-brand-600" size={24} />
              <button
                type="button"
                className="text-left"
                onClick={() => setViewId(d.id)}
              >
                <h3 className="font-semibold hover:text-brand-600">{d.title}</h3>
              </button>
              <p className="mt-2 line-clamp-4 flex-1 text-sm text-text-muted whitespace-pre-wrap">
                {d.content || 'No content yet.'}
              </p>
              <p className="mt-2 text-xs text-text-muted">
                Updated {formatDate(d.updatedAt)}
                {d.recordType ? ` · ${d.recordType}` : ' · general'}
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => openEdit(d)}>
                  <Pencil size={14} />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() =>
                    deleteConfirm(toast.askConfirm, d.title, () => {
                      deleteDocument(d.id)
                      if (viewId === d.id) setViewId(null)
                      toast.success('Document deleted')
                    })
                  }
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit document' : 'New document'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <Textarea
            label="Content"
            rows={10}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Markdown-friendly notes…"
          />
          <Select
            label="Link to record type"
            value={form.recordType ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setForm((f) => ({
                ...f,
                recordType: v ? (v as RecordType) : null,
                recordId: null,
              }))
            }}
            options={RECORD_OPTIONS}
          />
          {form.recordType && (
            <Select
              label="Record"
              value={form.recordId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, recordId: e.target.value || null }))}
              options={[
                { value: '', label: 'Select…' },
                ...recordOptionsForType(form.recordType),
              ]}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewId(null)} title={viewing?.title ?? ''}>
        {viewing && (
          <article>
            <p className="mb-4 text-xs text-text-muted">
              Updated {formatDate(viewing.updatedAt)}
              {viewing.recordType ? ` · linked to ${viewing.recordType}` : ''}
            </p>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm dark:prose-invert">
              {viewing.content || 'No content.'}
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="secondary" onClick={() => openEdit(viewing)}>
                Edit
              </Button>
              <Button variant="secondary" onClick={() => setViewId(null)}>
                Close
              </Button>
            </div>
          </article>
        )}
      </Modal>
    </>
  )
}
