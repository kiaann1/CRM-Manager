import { Check, ListTodo, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import type { Task, TaskPriority, TaskStatus } from '../types'
import { formatDate } from '../lib/format'
import { USER_SARAH } from '../lib/ids'

type TaskForm = Omit<Task, 'id' | 'createdAt'>

const emptyForm: TaskForm = {
  title: '',
  description: '',
  dueDate: new Date().toISOString().slice(0, 10),
  priority: 'medium',
  status: 'todo',
  contactId: null,
  dealId: null,
  ownerId: USER_SARAH,
  parentId: null,
  dependsOn: [],
  recurring: 'none',
  estimateMinutes: 0,
  loggedMinutes: 0,
  sprintId: null,
  goalId: null,
  checklist: [],
  tagIds: [],
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-rose-100 text-rose-700',
}

export function TasksPage() {
  const {
    tasks,
    contacts,
    deals,
    addTask,
    updateTask,
    deleteTask,
    setTaskStatus,
  } = useCrm()
  const toast = useToast()
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState<TaskForm>(emptyForm)

  const filtered =
    filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)

  const sorted = [...filtered].sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (task: Task) => {
    setEditing(task)
    setForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      contactId: task.contactId,
      dealId: task.dealId,
      ownerId: task.ownerId,
      parentId: task.parentId,
      dependsOn: task.dependsOn,
      recurring: task.recurring,
      estimateMinutes: task.estimateMinutes,
      loggedMinutes: task.loggedMinutes,
      sprintId: task.sprintId,
      goalId: task.goalId,
      checklist: task.checklist,
      tagIds: task.tagIds,
    })
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateTask(editing.id, form)
      toast.success('Task updated')
    } else {
      addTask(form)
      toast.success('Task created')
    }
    setModalOpen(false)
  }

  const contactOptions = [
    { value: '', label: 'No contact' },
    ...contacts.map((c) => ({
      value: c.id,
      label: `${c.firstName} ${c.lastName}`,
    })),
  ]

  const dealOptions = [
    { value: '', label: 'No deal' },
    ...deals.map((d) => ({ value: d.id, label: d.title })),
  ]

  const filters: { id: TaskStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'todo', label: 'To do' },
    { id: 'in_progress', label: 'In progress' },
    { id: 'done', label: 'Done' },
  ]

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Follow-ups and activities tied to your pipeline"
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Add task
          </Button>
        }
      />
      <div className="p-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === f.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface text-text-muted ring-1 ring-border hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks"
            description="Create tasks to stay on top of follow-ups."
            action={
              <Button onClick={openCreate}>
                <Plus size={16} />
                Add task
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {sorted.map((task) => (
              <li
                key={task.id}
                className={`flex items-start gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm ${
                  task.status === 'done' ? 'opacity-60' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setTaskStatus(
                      task.id,
                      task.status === 'done' ? 'todo' : 'done',
                    )
                  }
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    task.status === 'done'
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-border hover:border-brand-500'
                  }`}
                  aria-label={
                    task.status === 'done' ? 'Mark incomplete' : 'Mark complete'
                  }
                >
                  {task.status === 'done' && <Check size={14} />}
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => openEdit(task)}
                    className="text-left"
                  >
                    <p
                      className={`font-medium text-text ${
                        task.status === 'done' ? 'line-through' : ''
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-0.5 text-sm text-text-muted line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${priorityColors[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-xs text-text-muted">
                      Due {formatDate(task.dueDate)}
                    </span>
                    <span className="text-xs capitalize text-text-muted">
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="!p-2 shrink-0 text-rose-600"
                  onClick={() =>
                    deleteConfirm(toast.askConfirm, task.title, () => {
                      deleteTask(task.id)
                      toast.success('Task deleted')
                    })
                  }
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit task' : 'New task'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="task-form">
              {editing ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="task-form" className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Due date"
            type="date"
            required
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: e.target.value as TaskPriority })
            }
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as TaskStatus })
            }
            options={[
              { value: 'todo', label: 'To do' },
              { value: 'in_progress', label: 'In progress' },
              { value: 'done', label: 'Done' },
            ]}
          />
          <Select
            label="Contact"
            value={form.contactId ?? ''}
            onChange={(e) =>
              setForm({ ...form, contactId: e.target.value || null })
            }
            options={contactOptions}
          />
          <Select
            label="Deal"
            value={form.dealId ?? ''}
            onChange={(e) =>
              setForm({ ...form, dealId: e.target.value || null })
            }
            options={dealOptions}
          />
        </form>
      </Modal>
    </div>
  )
}
