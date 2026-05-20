import { Calendar, Mail, Phone, StickyNote } from 'lucide-react'
import { useMemo } from 'react'
import { useCrm } from '../../context/CrmContext'
import { useRegionalFormat } from '../../lib/useRegionalFormat'
import { DashboardPanel } from './DashboardPanel'

const typeConfig: Record<
  string,
  { icon: typeof Phone; color: string; bg: string }
> = {
  call: {
    icon: Phone,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-100 dark:bg-sky-950',
  },
  email: {
    icon: Mail,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-950',
  },
  meeting: {
    icon: Calendar,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-950',
  },
  note: {
    icon: StickyNote,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950',
  },
}

export function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const crm = useCrm()
  const { formatDate } = useRegionalFormat()

  const items = useMemo(() => {
    return [...crm.activities]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit)
      .map((a) => ({
        ...a,
        userName: crm.getUser(a.userId)?.name ?? 'Team',
        recordLabel: recordLabelFor(crm, a.recordType, a.recordId),
      }))
  }, [crm, limit])

  return (
    <DashboardPanel
      title="Recent activity"
      description="Calls, emails, meetings, and notes"
      noPadding
    >
      <ul className="max-h-[22rem] divide-y divide-border/80 overflow-y-auto">
        {items.length === 0 ? (
          <li className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-text">No activity yet</p>
            <p className="mt-1 text-xs text-text-muted">
              Log a call or note from any contact or deal record.
            </p>
          </li>
        ) : (
          items.map((a) => {
            const cfg = typeConfig[a.type] ?? typeConfig.note!
            const Icon = cfg.icon
            return (
              <li key={a.id} className="flex gap-4 px-5 py-3.5 transition-colors hover:bg-surface-muted/80">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}
                >
                  <Icon size={16} className={cfg.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">{a.subject}</p>
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {a.recordLabel} · {a.userName}
                  </p>
                  {a.body && (
                    <p className="mt-1 line-clamp-2 text-xs text-text-muted/90">{a.body}</p>
                  )}
                </div>
                <time className="shrink-0 text-[10px] font-medium text-text-muted">
                  {formatDate(a.at)}
                </time>
              </li>
            )
          })
        )}
      </ul>
    </DashboardPanel>
  )
}

function recordLabelFor(
  crm: ReturnType<typeof useCrm>,
  recordType: string,
  recordId: string,
): string {
  if (recordType === 'contact') {
    const c = crm.getContact(recordId)
    return c ? `${c.firstName} ${c.lastName}` : 'contact'
  }
  if (recordType === 'deal') {
    return crm.getDeal(recordId)?.title ?? 'deal'
  }
  if (recordType === 'company') {
    return crm.getCompany(recordId)?.name ?? 'company'
  }
  if (recordType === 'lead') {
    const l = crm.getLead(recordId)
    return l ? `${l.firstName} ${l.lastName}` : 'lead'
  }
  return recordType
}
