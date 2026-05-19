import { Mail, MessageSquare, Paperclip, X } from 'lucide-react'
import { useState } from 'react'
import { useCrm } from '../context/CrmContext'
import type { RecordType } from '../types'
import { formatDate } from '../lib/format'
import { summarizeRecord } from '../lib/ai'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'

interface RecordDrawerProps {
  recordType: RecordType
  recordId: string
  title: string
  onClose: () => void
}

export function RecordDrawer({ recordType, recordId, title, onClose }: RecordDrawerProps) {
  const crm = useCrm()
  const [tab, setTab] = useState<'timeline' | 'comments' | 'email' | 'files'>('timeline')
  const [comment, setComment] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  const activities = crm.getActivities(recordType, recordId)
  const comments = crm.getComments(recordType, recordId)
  const files = crm.getFiles(recordType, recordId)
  const openTasks = crm.tasks.filter(
    (t) =>
      (t.dealId === recordId && recordType === 'deal') ||
      (t.contactId === recordId && recordType === 'contact'),
  ).filter((t) => t.status !== 'done').length

  const aiSummary = summarizeRecord(recordType, title, activities.length, openTasks)

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
  }

  const sendEmail = () => {
    if (!crm.currentUser || !emailSubject) return
    crm.logEmail({
      recordType,
      recordId,
      to: 'contact@example.com',
      subject: emailSubject,
      body: emailBody,
      userId: crm.currentUser.id,
    })
    setEmailSubject('')
    setEmailBody('')
    setTab('timeline')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-surface shadow-2xl dark:bg-slate-900">
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
        </div>
        <nav className="flex gap-1 border-b border-border px-3 dark:border-slate-700">
          {(['timeline', 'comments', 'email', 'files'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-2.5 text-sm font-medium capitalize ${tab === t ? 'border-b-2 border-brand-600 text-brand-600' : 'text-text-muted'}`}
            >
              {t}
            </button>
          ))}
        </nav>
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'timeline' && (
            <ul className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-text-muted">No activities yet.</p>
              ) : (
                activities.map((a) => (
                  <li key={a.id} className="rounded-lg border border-border p-3 dark:border-slate-700">
                    <p className="text-xs font-medium uppercase text-text-muted">{a.type}</p>
                    <p className="font-medium">{a.subject}</p>
                    <p className="text-sm text-text-muted">{a.body}</p>
                    <p className="mt-1 text-xs text-text-muted">{formatDate(a.at)}</p>
                  </li>
                ))
              )}
            </ul>
          )}
          {tab === 'comments' && (
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-sm">{c.body}</p>
                  <p className="mt-1 text-xs text-text-muted">{formatDate(c.createdAt)}</p>
                </div>
              ))}
              <Textarea label="Add comment (@name to mention)" value={comment} onChange={(e) => setComment(e.target.value)} />
              <Button onClick={submitComment}><MessageSquare size={16} /> Post</Button>
            </div>
          )}
          {tab === 'email' && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">Send from CRM (logs to timeline). Connect Gmail/Outlook in Settings.</p>
              <Input label="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              <Textarea label="Body" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
              <Button onClick={sendEmail}><Mail size={16} /> Send & log</Button>
            </div>
          )}
          {tab === 'files' && (
            <ul className="space-y-2">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 dark:border-slate-700">
                  <Paperclip size={16} />
                  <span className="text-sm">{f.name}</span>
                  <span className="ml-auto text-xs text-text-muted">{Math.round(f.size / 1024)} KB</span>
                </li>
              ))}
              {!files.length && <p className="text-sm text-text-muted">No attachments.</p>}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}
