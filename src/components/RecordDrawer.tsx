import {
  Calendar,
  CheckSquare,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  StickyNote,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import type { ActivityType, RecordType } from '../types'
import { fullName } from '../lib/format'
import { useRegionalFormat } from '../lib/useRegionalFormat'
import { summarizeRecord } from '../lib/ai'
import { lockDocumentScroll } from '../lib/scrollLock'
import { CustomFieldsBlock } from './CustomFieldsBlock'
import { DealApprovalsPanel } from './DealApprovalsPanel'
import { DealContractsPanel } from './DealContractsPanel'
import { DealQuotesPanel } from './DealQuotesPanel'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'

interface RecordDrawerProps {
  recordType: RecordType
  recordId: string
  title: string
  emailTo?: string
  onClose: () => void
}

type Tab =
  | 'timeline'
  | 'tasks'
  | 'quotes'
  | 'contracts'
  | 'approvals'
  | 'comments'
  | 'email'
  | 'files'
  | 'related'

export function RecordDrawer({
  recordType,
  recordId,
  title,
  emailTo,
  onClose,
}: RecordDrawerProps) {
  const crm = useCrm()
  const { formatDate } = useRegionalFormat()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('timeline')
  const [comment, setComment] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [logSubject, setLogSubject] = useState('')
  const [logDetails, setLogDetails] = useState('')
  const [logMeetingLength, setLogMeetingLength] = useState('')
  const [logActionsText, setLogActionsText] = useState('')
  const [logAttachedNames, setLogAttachedNames] = useState<string[]>([])
  const [logType, setLogType] = useState<ActivityType>('note')

  const activities = crm.getActivities(recordType, recordId)
  const comments = crm.getComments(recordType, recordId)
  const files = crm.getFiles(recordType, recordId)

  const relatedTasks = crm.tasks.filter((t) => {
    if (recordType === 'deal') return t.dealId === recordId
    if (recordType === 'contact') return t.contactId === recordId
    if (recordType === 'company') {
      const dealIds = crm.deals.filter((d) => d.companyId === recordId).map((d) => d.id)
      return t.dealId != null && dealIds.includes(t.dealId)
    }
    return false
  })

  const openTasks = relatedTasks.filter((t) => t.status !== 'done').length

  const deal = recordType === 'deal' ? crm.getDeal(recordId) : undefined
  const contact =
    recordType === 'contact'
      ? crm.getContact(recordId)
      : deal?.contactId
        ? crm.getContact(deal.contactId)
        : undefined
  const company =
    recordType === 'company'
      ? crm.getCompany(recordId)
      : deal?.companyId
        ? crm.getCompany(deal.companyId)
        : undefined

  const resolvedEmail =
    emailTo ?? contact?.email ?? (recordType === 'lead' ? crm.getLead(recordId)?.email : undefined)

  const aiSummary = summarizeRecord(recordType, title, activities.length, openTasks)

  useEffect(() => {
    return lockDocumentScroll()
  }, [])

  const logActivity = (type: ActivityType, subject: string, body = '') => {
    if (!crm.currentUser) return
    crm.addActivity({
      type,
      subject,
      body,
      recordType,
      recordId,
      userId: crm.currentUser.id,
    })
    toast.success(`${subject} logged`)
  }

  const activityDefaults: Record<ActivityType, string> = {
    call: 'Call',
    email: 'Email',
    meeting: 'Meeting',
    note: 'Note',
  }

  const submitLog = () => {
    if (!crm.currentUser) return
    const subject = logSubject.trim() || activityDefaults[logType]
    const parts: string[] = []
    if (logType === 'meeting' && logMeetingLength.trim()) {
      parts.push(`Length: ${logMeetingLength.trim()}`)
    }
    const detail = logDetails.trim()
    if (detail) {
      parts.push(logType === 'meeting' ? `Notes:\n${detail}` : `Message:\n${detail}`)
    }
    if (logAttachedNames.length > 0) {
      parts.push(`Attachments: ${logAttachedNames.join(', ')}`)
    }
    if (logActionsText.trim()) {
      parts.push(`Actions:\n${logActionsText.trim()}`)
    }
    logActivity(logType, subject, parts.join('\n\n'))
    setLogSubject('')
    setLogDetails('')
    setLogMeetingLength('')
    setLogActionsText('')
    setLogAttachedNames([])
  }

  const handleLogFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File must be under 2 MB')
        e.target.value = ''
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        crm.uploadFile({
          recordType,
          recordId,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          storageKey: typeof reader.result === 'string' ? reader.result : undefined,
        })
        setLogAttachedNames((prev) => [...prev, file.name])
        toast.success(`${file.name} attached to this record`)
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    },
    [crm, recordType, recordId, toast],
  )

  const activityTypeHeading = (type: string) =>
    type.length ? type.charAt(0).toUpperCase() + type.slice(1) : type

  const logSubmitLabel =
    logType === 'call' ? 'Log call' : logType === 'meeting' ? 'Log meeting' : 'Log note'

  const submitComment = () => {
    if (!comment.trim() || !crm.currentUser) return
    const mentions = crm.users
      .filter((u) => comment.includes(`@${u.name}`))
      .map((u) => u.id)
    crm.addComment({
      recordType,
      recordId,
      userId: crm.currentUser.id,
      body: comment,
      mentions,
    })
    setComment('')
    toast.success('Comment posted')
  }

  const sendEmail = () => {
    if (!crm.currentUser || !emailSubject) return
    crm.logEmail({
      recordType,
      recordId,
      to: resolvedEmail ?? 'unknown',
      subject: emailSubject,
      body: emailBody,
      userId: crm.currentUser.id,
    })
    setEmailSubject('')
    setEmailBody('')
    setTab('timeline')
    toast.success('Email logged to timeline')
  }

  const recordTags =
    recordType === 'deal'
      ? (crm.getDeal(recordId)?.tagIds ?? [])
      : recordType === 'contact'
        ? (crm.getContact(recordId)?.tagIds ?? [])
        : []

  const tabs: { id: Tab; label: string }[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'tasks', label: `Tasks (${relatedTasks.length})` },
    ...(recordType === 'deal'
      ? [
          { id: 'quotes' as const, label: 'Quotes' },
          { id: 'contracts' as const, label: 'Contracts' },
          { id: 'approvals' as const, label: 'Approvals' },
        ]
      : []),
    { id: 'comments', label: 'Comments' },
    { id: 'email', label: 'Email' },
    { id: 'files', label: 'Files' },
  ]
  if (recordType === 'deal' || recordType === 'company') {
    tabs.push({ id: 'related', label: 'Related' })
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-0 justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <aside className="relative flex h-full max-h-dvh min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden bg-surface shadow-2xl sm:max-w-3xl dark:bg-slate-900">
        <header className="flex items-start justify-between border-b border-border px-5 py-4 dark:border-slate-700">
          <div>
            <p className="text-xs uppercase text-text-muted">{recordType}</p>
            <h2 className="text-lg font-bold text-text dark:text-white">{title}</h2>
          </div>
          <Button variant="ghost" className="!p-2" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </header>
        <div className="border-b border-border bg-brand-50/50 px-5 py-3 text-sm text-brand-900 dark:border-slate-700 dark:bg-brand-950/30 dark:text-brand-200">
          <strong>AI insight:</strong> {aiSummary}
          {recordTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {recordTags.map((tid) => {
                const t = crm.tags.find((x) => x.id === tid)
                return t ? (
                  <span
                    key={tid}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.name}
                  </span>
                ) : null
              })}
            </div>
          )}
        </div>
        <div className="border-b border-border px-5 pt-2 dark:border-slate-700">
          <CustomFieldsBlock entityType={recordType} entityId={recordId} />
        </div>
        <nav className="flex flex-wrap gap-x-1 gap-y-0 border-b border-border px-3 dark:border-slate-700">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap px-2.5 py-2.5 text-sm font-medium ${tab === t.id ? 'border-b-2 border-brand-600 text-brand-600' : 'text-text-muted hover:text-text'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'timeline' && (
            <div className="space-y-4">
              <section className="list-item p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-text-muted">Log activity</p>
                <p className="mb-2 text-xs text-text-muted">
                  Choose a type, fill in the form, then log — switching type does not submit.
                </p>
                <div className="mb-3 flex flex-wrap gap-1">
                  {(
                    [
                      ['call', Phone, 'Call'],
                      ['meeting', Calendar, 'Meeting'],
                      ['note', StickyNote, 'Note'],
                    ] as const
                  ).map(([type, Icon, label]) => (
                    <Button
                      key={type}
                      variant={logType === type ? 'primary' : 'secondary'}
                      className="px-2 py-1 text-xs"
                      onClick={() => setLogType(type)}
                    >
                      <Icon size={14} />
                      {label}
                    </Button>
                  ))}
                </div>
                <Input
                  label={
                    logType === 'meeting'
                      ? 'Meeting subject'
                      : logType === 'call'
                        ? 'Call subject'
                        : 'Subject'
                  }
                  value={logSubject}
                  onChange={(e) => setLogSubject(e.target.value)}
                  placeholder={
                    logType === 'meeting'
                      ? 'e.g. Q1 planning sync'
                      : logType === 'call'
                        ? 'e.g. Discovery call'
                        : 'e.g. Internal update'
                  }
                />
                {logType === 'meeting' && (
                  <Input
                    label="Length"
                    className="mt-2"
                    value={logMeetingLength}
                    onChange={(e) => setLogMeetingLength(e.target.value)}
                    placeholder="e.g. 30 minutes, 1 hour"
                  />
                )}
                <Textarea
                  label={logType === 'meeting' ? 'Notes' : 'Message'}
                  className="mt-2"
                  rows={logType === 'meeting' ? 3 : 4}
                  value={logDetails}
                  onChange={(e) => setLogDetails(e.target.value)}
                  placeholder={
                    logType === 'meeting'
                      ? 'Agenda, outcomes, decisions…'
                      : 'What was discussed or decided…'
                  }
                />
                <div className="mt-2">
                  <p className="mb-1 text-xs font-medium text-text">File upload</p>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm hover:bg-surface-muted dark:border-slate-600">
                    <Paperclip size={14} />
                    <span>Choose file (max 2 MB) — attaches to this record</span>
                    <input type="file" className="sr-only" onChange={handleLogFile} />
                  </label>
                  {logAttachedNames.length > 0 && (
                    <p className="mt-1 text-xs text-text-muted">
                      Files queued for activity summary: {logAttachedNames.join(', ')}
                    </p>
                  )}
                </div>
                <Textarea
                  label="Actions"
                  className="mt-2"
                  rows={2}
                  value={logActionsText}
                  onChange={(e) => setLogActionsText(e.target.value)}
                  placeholder="Follow-ups, owners, links, next steps…"
                />
                <Button className="mt-3" onClick={submitLog}>
                  {logSubmitLabel}
                </Button>
              </section>
              <ul className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-sm text-text-muted">No activities yet.</p>
                ) : (
                  activities.map((a) => (
                    <li
                      key={a.id}
                      className="list-item p-3"
                    >
                      <p className="text-xs font-medium uppercase text-text-muted">
                        {activityTypeHeading(a.type)}
                      </p>
                      <p className="font-medium">{a.subject}</p>
                      {a.body && (
                        <p className="whitespace-pre-wrap text-sm text-text-muted">{a.body}</p>
                      )}
                      <p className="mt-1 text-xs text-text-muted">
                        {crm.getUser(a.userId)?.name} · {formatDate(a.at)}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
          {tab === 'quotes' && recordType === 'deal' && <DealQuotesPanel dealId={recordId} />}
          {tab === 'contracts' && recordType === 'deal' && (
            <DealContractsPanel dealId={recordId} />
          )}
          {tab === 'approvals' && recordType === 'deal' && (
            <DealApprovalsPanel dealId={recordId} />
          )}
          {tab === 'tasks' && (
            <ul className="space-y-2">
              {relatedTasks.length === 0 ? (
                <p className="text-sm text-text-muted">No linked tasks.</p>
              ) : (
                relatedTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 dark:border-slate-700"
                  >
                    <CheckSquare
                      size={16}
                      className={t.status === 'done' ? 'text-emerald-600' : 'text-text-muted'}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-xs capitalize text-text-muted">
                        {t.status.replace('_', ' ')} · due {formatDate(t.dueDate)}
                      </p>
                    </div>
                  </li>
                ))
              )}
              <Link to="/tasks" className="text-sm font-medium text-brand-600">
                View all tasks →
              </Link>
            </ul>
          )}
          {tab === 'comments' && (
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-sm">{c.body}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {crm.getUser(c.userId)?.name} · {formatDate(c.createdAt)}
                  </p>
                </div>
              ))}
              <Textarea
                label="Add comment (@name to mention)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button onClick={submitComment}>
                <MessageSquare size={16} /> Post
              </Button>
            </div>
          )}
          {tab === 'email' && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">
                To: {resolvedEmail ?? '—'} (logged on send). Connect Gmail/Outlook in Settings.
              </p>
              <Input label="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              <Textarea label="Body" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
              <Button onClick={sendEmail}>
                <Mail size={16} /> Send & log
              </Button>
            </div>
          )}
          {tab === 'files' && (
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm hover:bg-surface-muted dark:border-slate-600">
                <Paperclip size={16} />
                <span>Upload file (max 2 MB)</span>
                <input
                  type="file"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 2 * 1024 * 1024) {
                      toast.error('File must be under 2 MB')
                      return
                    }
                    const reader = new FileReader()
                    reader.onload = () => {
                      crm.uploadFile({
                        recordType,
                        recordId,
                        name: file.name,
                        size: file.size,
                        mimeType: file.type || 'application/octet-stream',
                        storageKey:
                          typeof reader.result === 'string' ? reader.result : undefined,
                      })
                      toast.success('File attached')
                    }
                    reader.readAsDataURL(file)
                    e.target.value = ''
                  }}
                />
              </label>
              <ul className="space-y-2">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 dark:border-slate-700"
                  >
                    <Paperclip size={16} />
                    {f.storageKey?.startsWith('data:') ? (
                      <a
                        href={f.storageKey}
                        download={f.name}
                        className="text-sm text-brand-600 hover:underline"
                      >
                        {f.name}
                      </a>
                    ) : (
                      <span className="text-sm">{f.name}</span>
                    )}
                    <span className="ml-auto text-xs text-text-muted">
                      {Math.round(f.size / 1024)} KB
                    </span>
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => {
                        crm.deleteFile(f.id)
                        toast.success('Removed')
                      }}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
                {!files.length && (
                  <p className="text-sm text-text-muted">No attachments yet.</p>
                )}
              </ul>
            </div>
          )}
          {tab === 'related' && (
            <ul className="space-y-3 text-sm">
              {contact && (
                <li className="list-item p-3">
                  <p className="text-xs text-text-muted">Contact</p>
                  <p className="font-medium">
                    {fullName(contact.firstName, contact.lastName)}
                  </p>
                  <p className="text-text-muted">{contact.email}</p>
                </li>
              )}
              {company && (
                <li className="list-item p-3">
                  <p className="text-xs text-text-muted">Company</p>
                  <p className="font-medium">{company.name}</p>
                  <p className="text-text-muted">{company.industry}</p>
                </li>
              )}
              {deal && (
                <li className="list-item p-3">
                  <p className="text-xs text-text-muted">Deal value</p>
                  <p className="font-medium capitalize">{deal.stage}</p>
                </li>
              )}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}
