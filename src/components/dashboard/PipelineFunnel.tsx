import { useCrm } from '../../context/CrmContext'
import { useRegionalFormat } from '../../lib/useRegionalFormat'
import { funnelByStage } from '../../lib/pipeline'
import { badgeClass } from '../../lib/theme'
import { DashboardPanel } from './DashboardPanel'

export function PipelineFunnel() {
  const crm = useCrm()
  const { formatCurrency } = useRegionalFormat()
  const funnel = funnelByStage(crm).filter((s) => s.stage !== 'lost')
  const maxValue = Math.max(...funnel.map((f) => f.value), 1)
  const totalValue = funnel.reduce((s, f) => s + f.value, 0)

  return (
    <DashboardPanel title="Pipeline funnel" description="Value by stage">
      <div className="mb-4 rounded-xl bg-surface-muted/80 px-4 py-3 dark:bg-slate-800/50">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Total in funnel</p>
        <p className="text-xl font-bold tracking-tight text-text">{formatCurrency(totalValue)}</p>
      </div>
      <ul className="space-y-4">
        {funnel.map((row, index) => {
          const width = Math.max(8, (row.value / maxValue) * 100)
          return (
            <li key={row.stage}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${badgeClass(row.color)}`}>
                  {row.label}
                </span>
                <span className="text-xs font-medium text-text-muted">
                  {row.count} · {formatCurrency(row.value)}
                </span>
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500"
                  style={{
                    width: `${width}%`,
                    opacity: 1 - index * 0.06,
                  }}
                ></div>
              </div>
            </li>
          )
        })}
      </ul>
    </DashboardPanel>
  )
}
