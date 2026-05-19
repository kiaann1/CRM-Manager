import { ArrowLeft, Link2, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { RichTextEditor } from '../components/docs/RichTextEditor'
import { Button } from '../components/ui/Button'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/api/client'
import { deleteConfirm } from '../lib/confirm'
import { formatDate } from '../lib/format'
import { stripHtml } from '../lib/html'
import type { Document, RecordType } from '../types'

const RECORD_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'General (no link)' },
  { value: 'contact', label: 'Contact' },
  { value: 'company', label: 'Company' },
  { value: 'deal', label: 'Deal' },
  { value: 'lead', label: 'Lead' },
  { value: 'task', label: 'Task' },
]

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function DocumentEditorPage() {
  const { docId } = useParams<{ docId: string }>()
  const isNew = !docId
  const navigate = useNavigate()
  const toast = useToast()
  const crm = useCrm()
  const { documents, contacts, companies, deals, leads, tasks, patch, deleteDocument, refreshWorkspace } =
    crm

  const existing = !isNew ? documents.find((d) => d.id === docId) : undefined

  const [title, setTitle] = useState('Untitled document')
  const [content, setContent] = useState('')
  const [recordType, setRecordType] = useState<RecordType | null>(null)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [createdId, setCreatedId] = useState<string | null>(null)

  const hydratedRef = useRef<string | null>(null)
  const skipAutosaveRef = useRef(true)

  useEffect(() => {
    if (isNew) {
      hydratedRef.current = 'new'
      return
    }
    if (!existing) return
    if (hydratedRef.current === existing.id) return
    hydratedRef.current = existing.id
    skipAutosaveRef.current = true
    setTitle(existing.title)
    setContent(existing.content)
    setRecordType(existing.recordType)
    setRecordId(existing.recordId)
  }, [isNew, existing])

  const recordOptionsForType = (type: RecordType | null) => {
    if (!type) return []
    if (type === 'contact') return contacts.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))
    if (type === 'company') return companies.map((c) => ({ value: c.id, label: c.name }))
    if (type === 'deal') return deals.map((d) => ({ value: d.id, label: d.title }))
    if (type === 'lead') return leads.map((l) => ({ value: l.id, label: `${l.firstName} ${l.lastName}` }))
    if (type === 'task') return tasks.map((t) => ({ value: t.id, label: t.title }))
    return []
  }

  const persist = useCallback(async () => {
    const trimmedTitle = title.trim() || 'Untitled document'
    const payload = {
      title: trimmedTitle,
      content,
      recordType,
      recordId: recordType && recordId ? recordId : null,
    }

    setSaveState('saving')
    try {
      if (isNew && !createdId) {
        const doc = (await api.createDocument(payload)) as Document
        setCreatedId(doc.id)
        hydratedRef.current = doc.id
        await refreshWorkspace()
        navigate(`/docs/${doc.id}`, { replace: true })
        setSaveState('saved')
        return
      }
      const id = createdId ?? docId!
      const updatedAt = new Date().toISOString()
      await api.updateDocument(id, payload)
      patch((prev) => ({
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === id ? { ...d, ...payload, updatedAt } : d,
        ),
      }))
      setSaveState('saved')
    } catch (e) {
      setSaveState('error')
      toast.error(e instanceof Error ? e.message : 'Could not save document')
    }
  }, [
    title,
    content,
    recordType,
    recordId,
    isNew,
    createdId,
    docId,
    navigate,
    refreshWorkspace,
    patch,
    toast,
  ])

  useEffect(() => {
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false
      return
    }
    const t = window.setTimeout(() => {
      if (!title.trim() && !stripHtml(content)) return
      void persist()
    }, 2000)
    return () => window.clearTimeout(t)
  }, [title, content, recordType, recordId, persist])

  if (!isNew && documents.length > 0 && !existing && !createdId) {
    return <Navigate to="/docs" replace />
  }

  const handleDelete = () => {
    const id = createdId ?? docId
    if (!id) {
      navigate('/docs')
      return
    }
    deleteConfirm(toast.askConfirm, title, () => {
      deleteDocument(id)
      toast.success('Document deleted')
      navigate('/docs')
    })
  }

  const statusLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'saved'
        ? 'Saved'
        : saveState === 'error'
          ? 'Save failed'
          : 'Auto-save on'

  return (
    <div className="doc-editor-screen flex min-h-[calc(100vh-3rem)] flex-col bg-slate-100 dark:bg-slate-950">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <Link
          to="/docs"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-muted hover:text-text"
        >
          <ArrowLeft size={16} />
          All docs
        </Link>

        <span className="hidden text-border sm:inline dark:text-slate-600">|</span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <select
            className="form-control w-36 py-1.5 text-xs"
            value={recordType ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setRecordType(v ? (v as RecordType) : null)
              setRecordId(null)
            }}
          >
            {RECORD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {recordType && (
            <select
              className="form-control min-w-[10rem] flex-1 py-1.5 text-xs"
              value={recordId ?? ''}
              onChange={(e) => setRecordId(e.target.value || null)}
            >
              <option value="">Select record…</option>
              {recordOptionsForType(recordType).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          {recordType && recordId && (
            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
              <Link2 size={12} />
              Linked
            </span>
          )}
        </div>

        <span className="text-xs text-text-muted">{statusLabel}</span>

        <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => void persist()}>
          <Save size={14} className="mr-1 inline" />
          Save now
        </Button>

        {!isNew && (
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={handleDelete}>
            <Trash2 size={14} />
          </Button>
        )}
      </header>

      <div className="flex flex-1 justify-center overflow-auto p-6 md:p-10">
        <article className="doc-editor-page flex w-full max-w-[816px] flex-col rounded-sm border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setSaveState('idle')
            }}
            placeholder="Document title"
            className="border-b border-slate-100 px-10 pb-4 pt-10 text-3xl font-semibold tracking-tight text-slate-900 outline-none placeholder:text-slate-300 dark:border-slate-800 dark:bg-transparent dark:text-slate-50 dark:placeholder:text-slate-600"
          />

          {existing && (
            <p className="px-10 pb-2 text-xs text-text-muted">
              Last updated {formatDate(existing.updatedAt)}
            </p>
          )}

          <div className="flex min-h-[560px] flex-1 flex-col px-10 pb-12">
            <RichTextEditor
              value={content}
              onChange={(html) => {
                setContent(html)
                setSaveState('idle')
              }}
            />
          </div>
        </article>
      </div>
    </div>
  )
}
