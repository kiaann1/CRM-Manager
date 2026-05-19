import { useMemo } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { StatCard } from '../components/StatCard'
import { useCrm } from '../context/CrmContext'
import { formatCurrency } from '../lib/format'
import { downloadCsv, toCsv } from '../lib/csv'
import { BarChart3, Download, TrendingUp } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { getNextBestActions } from '../lib/ai'
import { USER_SARAH } from '../lib/ids'

export function ReportsPage() {
  const crm = useCrm()
  const userId = crm.session?.userId ?? USER_SARAH

  const funnel = useMemo(() => {
    return [...crm.pipelineStages]
      .sort((a, b) => a.order - b.order)
      .filter((s) => s.key !== 'lost')
      .map((stage) => ({
        stage: stage.label,
        count: crm.deals.filter((d) => d.stage === stage.key).length,
        value: crm.deals.filter((d) => d.stage === stage.key).reduce((s, d) => s + d.value, 0),
      }))
  }, [crm.deals, crm.pipelineStages])

  const weighted = crm.deals
    .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
    .reduce((sum, d) => {
      const prob = crm.pipelineStages.find((p) => p.key === d.stage)?.probability ?? 10
      return sum + (d.value * prob) / 100
    }, 0)

  const activityByRep = crm.users.map((u) => ({
    name: u.name,
    count: crm.activities.filter((a) => a.userId === u.id).length,
  }))

  const exportReport = () => {
    downloadCsv('pipeline-report.csv', toCsv(funnel.map((f) => ({ stage: f.stage, count: f.count, value: f.value }))))
  }

  const aiActions = getNextBestActions(crm, userId)

  return (
    <div>
      <PageHeader title="Reports" description="Funnel, forecasting, activity metrics, and AI next-best-actions" actions={
        <Button variant="secondary" onClick={exportReport}><Download size={16} /> Export CSV</Button>
      } />
      <div className="page-shell space-y-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Weighted forecast" value={formatCurrency(weighted)} icon={TrendingUp} />
          <StatCard label="Won YTD" value={formatCurrency(crm.deals.filter((d) => d.stage === 'won').reduce((s, d) => s + d.value, 0))} icon={BarChart3} />
          <StatCard label="Open deals" value={String(crm.deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length)} icon={BarChart3} />
        </section>
        <section className="panel panel-pad-lg">
          <h2 className="mb-4 font-semibold">Pipeline funnel</h2>
          <div className="space-y-3">
            {funnel.map((f) => (
              <div key={f.stage}>
                <div className="mb-1 flex justify-between text-sm"><span>{f.stage}</span><span>{f.count} · {formatCurrency(f.value)}</span></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.max(5, (f.count / Math.max(crm.deals.length, 1)) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="panel panel-pad-lg">
            <h2 className="mb-4 font-semibold">Activity by rep</h2>
            <ul className="space-y-2">{activityByRep.map((r) => <li key={r.name} className="flex justify-between text-sm"><span>{r.name}</span><span className="font-medium">{r.count}</span></li>)}</ul>
          </div>
          <div className="panel panel-accent panel-pad-lg">
            <h2 className="mb-4 font-semibold">AI next-best actions</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm">{aiActions.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
        </section>
        <section className="panel panel-pad-lg">
          <h2 className="mb-2 font-semibold">Cohort / retention (post-sale)</h2>
          <p className="text-sm text-text-muted">Avg health score: {Math.round(crm.companies.reduce((s, c) => s + c.healthScore, 0) / Math.max(crm.companies.length, 1))} · NPS responses: {crm.surveys.length}</p>
        </section>
      </div>
    </div>
  )
}
