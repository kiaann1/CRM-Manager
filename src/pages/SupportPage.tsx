import { LifeBuoy, Plus } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import type { TicketStatus } from '../types'

export function SupportPage() {
  const { tickets, companies, surveys, updateTicket, addTicket, addSurvey, getCompany, currentUser, users } =
    useCrm()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [npsCompanyId, setNpsCompanyId] = useState('')
  const [npsScore, setNpsScore] = useState(8)
  const [npsFeedback, setNpsFeedback] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')

  const assigneeId = currentUser?.id ?? users[0]?.id ?? ''

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) return
    addTicket({
      subject: subject.trim(),
      description,
      status: 'open',
      priority,
      companyId: companyId || null,
      contactId: null,
      assigneeId,
      slaDue: null,
    })
    toast.success('Ticket created')
    setModalOpen(false)
    setSubject('')
    setDescription('')
  }

  return (
    <div>
      <PageHeader
        title="Support"
        description="Tickets, SLA timers, health scores, onboarding & NPS"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New ticket
          </Button>
        }
      />
      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <LifeBuoy size={18} /> Tickets
          </h2>
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li key={t.id} className="rounded-lg border border-border p-3 dark:border-slate-700">
                <p className="font-medium">{t.subject}</p>
                <p className="text-xs text-text-muted">
                  {t.companyId ? getCompany(t.companyId)?.name : 'No company'} · SLA{' '}
                  {t.slaDue ? formatDate(t.slaDue) : '—'}
                </p>
                {t.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-text-muted">{t.description}</p>
                )}
                <select
                  className="mt-2 rounded border border-border px-2 py-1 text-xs"
                  value={t.status}
                  onChange={(e) =>
                    updateTicket(t.id, { status: e.target.value as TicketStatus })
                  }
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </li>
            ))}
            {tickets.length === 0 && (
              <p className="text-sm text-text-muted">No tickets yet.</p>
            )}
          </ul>
        </section>
        <section className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold">Account health</h2>
            {companies.map((c) => (
              <div key={c.id} className="mb-2 flex justify-between text-sm">
                <span>{c.name}</span>
                <span
                  className={`font-bold ${c.healthScore >= 80 ? 'text-emerald-600' : c.healthScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}
                >
                  {c.healthScore}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold">NPS / CSAT</h2>
            <div className="mb-4 space-y-3 rounded-lg border border-dashed border-border p-3 dark:border-slate-600">
              <p className="text-xs font-medium text-text-muted">Record a score (updates account health)</p>
              <Select
                label="Company"
                value={npsCompanyId}
                onChange={(e) => setNpsCompanyId(e.target.value)}
                options={[
                  { value: '', label: 'Select company…' },
                  ...companies.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              <Input
                label="Score (0–10)"
                type="number"
                min={0}
                max={10}
                value={npsScore}
                onChange={(e) => setNpsScore(Number(e.target.value))}
              />
              <Textarea
                label="Feedback"
                value={npsFeedback}
                onChange={(e) => setNpsFeedback(e.target.value)}
                rows={2}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (!npsCompanyId) {
                    toast.error('Select a company')
                    return
                  }
                  addSurvey({
                    companyId: npsCompanyId,
                    score: npsScore,
                    feedback: npsFeedback.trim(),
                  })
                  toast.success('Survey recorded')
                  setNpsFeedback('')
                }}
              >
                Submit survey
              </Button>
            </div>
            {surveys.map((s) => (
              <p key={s.id} className="mb-2 text-sm">
                <span className="font-medium">{getCompany(s.companyId)?.name ?? 'Company'}</span>
                {' — '}
                {s.score}/10{s.feedback ? `: ${s.feedback}` : ''}
              </p>
            ))}
            {surveys.length === 0 && <p className="text-sm text-text-muted">No surveys yet</p>}
          </div>
        </section>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New support ticket">
        <form className="space-y-4" onSubmit={submit}>
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select
            label="Company"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            options={[
              { value: '', label: 'None' },
              ...companies.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
          <Button type="submit">Create ticket</Button>
        </form>
      </Modal>
    </div>
  )
}
