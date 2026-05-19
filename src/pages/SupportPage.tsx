import { LifeBuoy } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { useCrm } from '../context/CrmContext'
import { formatDate } from '../lib/format'
import { Button } from '../components/ui/Button'

export function SupportPage() {
  const { tickets, companies, surveys, updateTicket, getCompany } = useCrm()

  return (
    <div>
      <PageHeader title="Support" description="Tickets, SLA timers, health scores, onboarding & NPS" />
      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><LifeBuoy size={18} /> Tickets</h2>
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li key={t.id} className="rounded-lg border border-border p-3 dark:border-slate-700">
                <p className="font-medium">{t.subject}</p>
                <p className="text-xs text-text-muted">{getCompany(t.companyId ?? '')?.name} · SLA {t.slaDue ? formatDate(t.slaDue) : '—'}</p>
                <select className="mt-2 rounded border border-border px-2 py-1 text-xs" value={t.status} onChange={(e) => updateTicket(t.id, { status: e.target.value as typeof t.status })}>
                  <option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                </select>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold">Account health</h2>
            {companies.map((c) => (
              <div key={c.id} className="mb-2 flex justify-between text-sm">
                <span>{c.name}</span>
                <span className={`font-bold ${c.healthScore >= 80 ? 'text-emerald-600' : c.healthScore >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{c.healthScore}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold">NPS / CSAT</h2>
            {surveys.map((s) => <p key={s.id} className="text-sm">Score {s.score}/10 — {s.feedback}</p>)}
          </div>
          <Button variant="secondary">Open knowledge base</Button>
        </section>
      </div>
    </div>
  )
}
