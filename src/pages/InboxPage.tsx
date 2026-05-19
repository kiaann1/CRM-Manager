import { PageHeader } from '../components/layout/PageHeader'
import { useCrm } from '../context/CrmContext'

export function InboxPage() {
  const { inbox, teams } = useCrm()

  return (
    <>
      <PageHeader title="Team inbox" description="Shared sales & support email alias" />
      <ul className="space-y-2 p-8">
        {inbox.map((m) => (
          <li
            key={m.id}
            className={`rounded-xl border border-border bg-surface p-4 dark:border-slate-700 dark:bg-slate-900 ${m.read ? 'opacity-70' : ''}`}
          >
            <p className="text-xs text-text-muted">{teams.find((t) => t.id === m.teamId)?.name}</p>
            <p className="font-medium">{m.subject}</p>
            <p className="text-sm text-text-muted">From {m.from}</p>
            <p className="mt-2 text-sm">{m.body}</p>
          </li>
        ))}
      </ul>
      {!inbox.length && <p className="px-8 text-text-muted">Inbox empty</p>}
    </>
  )
}
