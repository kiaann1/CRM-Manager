import { Columns, LayoutGrid, Calendar, GanttChart, Plus } from 'lucide-react'
import { useState, type DragEvent } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

type BoardView = 'board' | 'table' | 'calendar' | 'timeline'

export function BoardsPage() {
  const {
    boards,
    boardColumns,
    boardItems,
    getUser,
    addBoardItem,
    moveBoardItem,
    createBoard,
    currentUser,
    users,
  } = useCrm()
  const toast = useToast()
  const [boardId, setBoardId] = useState(boards[0]?.id ?? '')
  const [view, setView] = useState<BoardView>('board')
  const [modalOpen, setModalOpen] = useState(false)
  const [boardModalOpen, setBoardModalOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newColumnId, setNewColumnId] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const columns = boardColumns.filter((c) => c.boardId === boardId).sort((a, b) => a.order - b.order)
  const items = boardItems.filter((i) => i.boardId === boardId)
  const ownerId = currentUser?.id ?? users[0]?.id ?? ''

  const views: { id: BoardView; label: string; icon: typeof Columns }[] = [
    { id: 'board', label: 'Board', icon: Columns },
    { id: 'table', label: 'Table', icon: LayoutGrid },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'timeline', label: 'Timeline', icon: GanttChart },
  ]

  const onDrop = (e: DragEvent, columnId: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/board-item')
    if (id) {
      moveBoardItem(id, columnId)
      toast.info('Card moved')
    }
    setDraggingId(null)
  }

  const createItem = () => {
    if (!newTitle.trim() || !boardId || !newColumnId) return
    addBoardItem({
      boardId,
      columnId: newColumnId,
      title: newTitle.trim(),
      ownerId,
      recordType: null,
      recordId: null,
      dueDate: null,
      order: 0,
    })
    setNewTitle('')
    setModalOpen(false)
    toast.success('Card added')
  }

  return (
    <div>
      <PageHeader
        title="Boards"
        description="Custom workspaces — drag cards between columns"
        actions={
          <>
            <select
              className="rounded-lg border border-border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={boardId}
              onChange={(e) => {
                setBoardId(e.target.value)
                const cols = boardColumns.filter((c) => c.boardId === e.target.value)
                setNewColumnId(cols[0]?.id ?? '')
              }}
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={() => setBoardModalOpen(true)}>
              <Plus size={16} /> New board
            </Button>
            <Button
              onClick={() => {
                setNewColumnId(columns[0]?.id ?? '')
                setModalOpen(true)
              }}
              disabled={!boardId || columns.length === 0}
            >
              <Plus size={16} /> Add card
            </Button>
          </>
        }
      />
      <div className="flex gap-2 border-b border-border px-8 dark:border-slate-700">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`flex items-center gap-2 px-3 py-3 text-sm font-medium ${view === v.id ? 'border-b-2 border-brand-600 text-brand-600' : 'text-text-muted'}`}
          >
            <v.icon size={16} /> {v.label}
          </button>
        ))}
      </div>
      <div className="p-8">
        {boards.length === 0 ? (
          <p className="text-sm text-text-muted">No boards in this workspace yet.</p>
        ) : view === 'board' ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((col) => (
              <div
                key={col.id}
                className="w-72 shrink-0 rounded-xl border border-border bg-surface-muted dark:border-slate-700 dark:bg-slate-800/50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, col.id)}
              >
                <p className="border-b border-border px-4 py-3 font-semibold dark:border-slate-700">
                  {col.title}
                </p>
                <ul className="min-h-[4rem] space-y-2 p-3">
                  {items
                    .filter((i) => i.columnId === col.id)
                    .map((item) => (
                      <li
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/board-item', item.id)
                          setDraggingId(item.id)
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        className={`cursor-grab rounded-lg border border-border bg-surface p-3 shadow-sm active:cursor-grabbing dark:border-slate-600 dark:bg-slate-900 ${draggingId === item.id ? 'opacity-50' : ''}`}
                      >
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-text-muted">
                          {getUser(item.ownerId)?.name}
                          {item.dueDate ? ` · ${formatDate(item.dueDate)}` : ''}
                        </p>
                        {item.recordType && (
                          <p className="mt-1 text-[10px] uppercase text-brand-600">
                            Linked {item.recordType}
                          </p>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        ) : view === 'table' ? (
          <table className="w-full rounded-xl border border-border bg-surface text-sm dark:border-slate-700 dark:bg-slate-900">
            <thead>
              <tr className="bg-surface-muted dark:bg-slate-800">
                <th className="px-4 py-2 text-left">Item</th>
                <th>Column</th>
                <th>Owner</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t dark:border-slate-700">
                  <td className="px-4 py-2">{i.title}</td>
                  <td className="px-4 py-2">{columns.find((c) => c.id === i.columnId)?.title}</td>
                  <td className="px-4 py-2">{getUser(i.ownerId)?.name}</td>
                  <td className="px-4 py-2">{i.dueDate ? formatDate(i.dueDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : view === 'calendar' ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items
              .filter((i) => i.dueDate)
              .map((i) => (
                <div
                  key={i.id}
                  className="rounded-lg border border-border bg-surface p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <p className="font-medium">{i.title}</p>
                  <p className="text-sm text-brand-600">{formatDate(i.dueDate!)}</p>
                </div>
              ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((i, idx) => (
              <div key={i.id} className="flex items-center gap-4">
                <div className="w-24 text-xs text-text-muted">Step {idx + 1}</div>
                <div
                  className="h-8 flex-1 rounded-lg bg-brand-100 dark:bg-brand-900/40"
                  style={{ maxWidth: `${40 + idx * 15}%` }}
                />
                <span className="text-sm">{i.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={boardModalOpen} onClose={() => setBoardModalOpen(false)} title="New board">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!newBoardName.trim()) return
            createBoard(newBoardName.trim())
            toast.success('Board created — select it from the dropdown')
            setNewBoardName('')
            setBoardModalOpen(false)
          }}
        >
          <Input
            label="Board name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="e.g. Customer onboarding"
            required
          />
          <Button type="submit">Create board</Button>
        </form>
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New board card">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            createItem()
          }}
        >
          <Input label="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
          <label className="block text-sm font-medium">
            Column
            <select
              className="form-control mt-1 w-full"
              value={newColumnId}
              onChange={(e) => setNewColumnId(e.target.value)}
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Add</Button>
        </form>
      </Modal>
    </div>
  )
}
