import { Megaphone } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { useCrm } from '../context/CrmContext'
import { formatCurrency } from '../lib/format'

export function MarketingPage() {
  const { forms, campaigns, leads, emailSequences } = useCrm()

  return (
    <div>
      <PageHeader title="Marketing" description="Forms, campaigns, UTM attribution, nurture sequences, scheduler & chat" />
      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold">Lead capture forms</h2>
          {forms.map((f) => (
            <div key={f.id} className="mb-4 rounded-lg border border-border p-4 dark:border-slate-700">
              <p className="font-medium">{f.name}</p>
              <p className="text-xs text-text-muted">{f.fields.length} fields · {f.submissions.length} submissions</p>
              <p className="mt-2 text-xs">Embed: /embed/form/{f.id}</p>
            </div>
          ))}
        </section>
        <section className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold">Campaigns & attribution</h2>
          {campaigns.map((c) => (
            <p key={c.id} className="text-sm"><Megaphone className="mr-1 inline" size={14} />{c.name} — {c.utmSource}/{c.utmMedium} · {formatCurrency(c.budget)}</p>
          ))}
          <h3 className="mt-4 mb-2 text-sm font-medium">Leads by UTM</h3>
          {leads.map((l) => <p key={l.id} className="text-xs text-text-muted">{l.email}: {l.utmSource || 'direct'}</p>)}
        </section>
        <section className="rounded-xl border border-border bg-surface p-5 lg:col-span-2 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-2 font-semibold">Meeting scheduler & live chat</h2>
          <p className="text-sm text-text-muted">Scheduler link: /book/demo · Chat widget captures visitors as leads (see Leads — Ava Patel from live chat).</p>
          <p className="mt-2 text-sm">Active nurture sequences: {emailSequences.filter((s) => s.enabled).map((s) => s.name).join(', ')}</p>
        </section>
      </div>
    </div>
  )
}
