import { Zap } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { useCrm } from '../context/CrmContext'
import { describeRule } from '../lib/automations'
export function AutomationsPage() {
  const { automations, updateAutomation, webhooks, integrations, emailSequences, approvals } = useCrm()

  return (
    <div>
      <PageHeader title="Automations" description="Workflows, sequences, webhooks, integrations, and approvals" />
      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Zap size={18} /> Rules</h2>
          <ul className="space-y-3">
            {automations.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3 dark:border-slate-700">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-text-muted">{describeRule(r)} · {r.actions.length} action(s)</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={r.enabled} onChange={(e) => updateAutomation(r.id, { enabled: e.target.checked })} />
                  On
                </label>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold">Email sequences</h2>
            {emailSequences.map((s) => <p key={s.id} className="text-sm">{s.name} — {s.steps.length} steps {s.enabled ? '✓' : ''}</p>)}
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold">Webhooks & API</h2>
            {webhooks.map((w) => <p key={w.id} className="truncate text-sm text-text-muted">{w.url} ({w.events.join(', ')})</p>)}
            <p className="mt-2 text-xs text-text-muted">Public REST API: POST /api/v1/deals (configure in Settings)</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold">Integrations</h2>
            {integrations.map((i) => (
              <div key={i.id} className="flex justify-between py-1 text-sm">
                <span>{i.name}</span>
                <span className={i.enabled ? 'text-emerald-600' : 'text-text-muted'}>{i.enabled ? 'Connected' : 'Off'}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold">Pending approvals</h2>
            {approvals.filter((a) => a.status === 'pending').map((a) => (
              <p key={a.id} className="text-sm">{a.title} — deal {a.dealId}</p>
            ))}
            {!approvals.filter((a) => a.status === 'pending').length && <p className="text-sm text-text-muted">None pending</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
