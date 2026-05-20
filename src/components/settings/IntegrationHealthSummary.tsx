import { CheckCircle2, Circle, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Integration } from '../../types'
import { useRegionalFormat } from '../../lib/useRegionalFormat'

function statusIcon(integration: Integration) {
  if (!integration.enabled) {
    return <Circle size={14} className="text-text-muted" aria-hidden />
  }
  if (integration.lastTestOk === false) {
    return <XCircle size={14} className="text-rose-500" aria-hidden />
  }
  if (integration.lastTestOk === true || integration.connected) {
    return <CheckCircle2 size={14} className="text-emerald-500" aria-hidden />
  }
  return <Circle size={14} className="text-amber-500" aria-hidden />
}

function statusLabel(integration: Integration) {
  if (!integration.enabled) return 'Disabled'
  if (integration.lastTestOk === false) return 'Test failed'
  if (integration.lastTestOk === true) return 'Test passed'
  if (integration.connected) return 'Connected'
  return 'Enabled — not tested'
}

export function IntegrationHealthSummary({ integrations }: { integrations: Integration[] }) {
  const { formatDate } = useRegionalFormat()
  if (integrations.length === 0) {
    return <p className="text-sm text-text-muted">No integrations loaded.</p>
  }

  return (
    <ul className="space-y-2">
      {integrations.map((i) => (
        <li
          key={i.id}
          className="flex items-center justify-between gap-3 list-item px-3 py-2.5 text-sm"
        >
          <div className="flex min-w-0 items-center gap-2">
            {statusIcon(i)}
            <span className="truncate font-medium text-text">{i.name}</span>
          </div>
          <div className="shrink-0 text-right text-xs text-text-muted">
            <p>{statusLabel(i)}</p>
            {i.lastSyncAt && (
              <p className="mt-0.5">Sync {formatDate(i.lastSyncAt)}</p>
            )}
            {i.lastTestAt && !i.lastSyncAt && (
              <p className="mt-0.5">Test {formatDate(i.lastTestAt)}</p>
            )}
          </div>
        </li>
      ))}
      <li className="pt-1">
        <Link
          to="/integrations"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
        >
          Manage all integrations →
        </Link>
      </li>
    </ul>
  )
}
