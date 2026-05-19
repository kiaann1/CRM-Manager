import { Columns, LayoutGrid, Calendar, GanttChart } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { useCrm } from '../context/CrmContext'
import { formatDate } from '../lib/format'

type BoardView = 'board' | 'table' | 'calendar' | 'timeline'

export function BoardsPage() {
  const { boards, boardColumns, boardItems, getUser } = useCrm()
  const [boardId, setBoardId] = useState(boards[0]?.id ?? '')
  const [view, setView] = useState<BoardView>('board')
  const columns = boardColumns.filter((c) => c.boardId === boardId).sort((a, b) => a.order - b.order)
  const items = boardItems.filter((i) => i.boardId === boardId)

  const views: { id: BoardView; label: string; icon: typeof Columns }[] = [
    { id: 'board', label: 'Board', icon: Columns },
    { id: 'table', label: 'Table', icon: LayoutGrid },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'timeline', label: 'Timeline', icon: GanttChart },
  ]

  return (
    <div>
      <PageHeader title="Boards" description="Custom workspaces — Monday.com style multi-view boards" actions={
        <select className="rounded-lg border border-border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={boardId} onChange={(e) => setBoardId(e.target.value)}>
          {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      } />
      <div className="flex gap-2 border-b border-border px-8 dark:border-slate-700">
        {views.map((v) => (
          <button key={v.id} type="button" onClick={() => setView(v.id)} className={`flex items-center gap-2 px-3 py-3 text-sm font-medium ${view === v.id ? 'border-b-2 border-brand-600 text-brand-600' : 'text-text-muted'}`}>
            <v.icon size={16} /> {v.label}
          </button>
        ))}
      </div>
      <div className="p-8">
        {view === 'board' && (
          <div className="flex gap-4 overflow-x-auto">
            {columns.map((col) => (
              <div key={col.id} className="w-72 shrink-0 rounded-xl border border-border bg-surface-muted dark:border-slate-700 dark:bg-slate-800/50">
                <p className="border-b border-border px-4 py-3 font-semibold dark:border-slate-700">{col.title}</p>
                <ul className="space-y-2 p-3">
                  {items.filter((i) => i.columnId === col.id).map((item) => (
                    <li key={item.id} className="rounded-lg border border-border bg-surface p-3 shadow-sm dark:border-slate-600 dark:bg-slate-900">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-text-muted">{getUser(item.ownerId)?.name}{item.dueDate ? ` · ${formatDate(item.dueDate)}` : ''}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {view === 'table' && (
          <table className="w-full rounded-xl border border-border bg-surface text-sm dark:border-slate-700 dark:bg-slate-900">
            <thead><tr className="bg-surface-muted dark:bg-slate-800"><th className="px-4 py-2 text-left">Item</th><th>Column</th><th>Owner</th><th>Due</th></tr></thead>
            <tbody>{items.map((i) => <tr key={i.id} className="border-t dark:border-slate-700"><td className="px-4 py-2">{i.title}</td><td className="px-4 py-2">{columns.find((c) => c.id === i.columnId)?.title}</td><td className="px-4 py-2">{getUser(i.ownerId)?.name}</td><td className="px-4 py-2">{i.dueDate ? formatDate(i.dueDate) : '—'}</td></tr>)}</tbody>
          </table>
        )}
        {view === 'calendar' && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.filter((i) => i.dueDate).map((i) => (
              <div key={i.id} className="rounded-lg border border-border bg-surface p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="font-medium">{i.title}</p>
                <p className="text-sm text-brand-600">{formatDate(i.dueDate!)}</p>
              </div>
            ))}
          </div>
        )}
        {view === 'timeline' && (
          <div className="space-y-2">
            {items.map((i, idx) => (
              <div key={i.id} className="flex items-center gap-4">
                <div className="w-24 text-xs text-text-muted">Week {idx + 1}</div>
                <div className="h-8 flex-1 rounded-lg bg-brand-100 dark:bg-brand-900/40" style={{ maxWidth: `${40 + idx * 15}%` }} />
                <span className="text-sm">{i.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
