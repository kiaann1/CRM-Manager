import { Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageFrame } from '../components/layout/PageFrame'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import { formatCurrency } from '../lib/format'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import type { Goal, Sprint } from '../types'

type GoalForm = Omit<Goal, 'id'>

const QUARTERS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027']

function emptyGoal(ownerId: string): GoalForm {
  return {
    title: '',
    target: 100000,
    current: 0,
    quarter: QUARTERS[0]!,
    ownerId,
  }
}

type SprintForm = Omit<Sprint, 'id'>

function defaultSprint(teamId: string): SprintForm {
  const start = new Date()
  const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000)
  return {
    name: '',
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    teamId,
  }
}

export function GoalsPage() {
  const {
    goals,
    sprints,
    tasks,
    timeEntries,
    users,
    teams,
    addGoal,
    updateGoal,
    deleteGoal,
    addSprint,
    currentUser,
  } = useCrm()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [sprintModalOpen, setSprintModalOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState<GoalForm>(() =>
    emptyGoal(currentUser?.id ?? users[0]?.id ?? ''),
  )
  const defaultTeamId = currentUser?.teamId ?? teams[0]?.id ?? ''
  const [sprintForm, setSprintForm] = useState<SprintForm>(() => defaultSprint(defaultTeamId))

  const ownerId = currentUser?.id ?? users[0]?.id ?? ''

  const openCreate = () => {
    setEditing(null)
    setForm(emptyGoal(ownerId))
    setModalOpen(true)
  }

  const openEdit = (goal: Goal) => {
    setEditing(goal)
    setForm({
      title: goal.title,
      target: goal.target,
      current: goal.current,
      quarter: goal.quarter,
      ownerId: goal.ownerId,
    })
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = { ...form, title: form.title.trim() }
    if (editing) {
      updateGoal(editing.id, payload)
      toast.success('Goal updated')
    } else {
      addGoal(payload)
      toast.success('Goal created')
    }
    setModalOpen(false)
  }

  const userOptions = users.map((u) => ({ value: u.id, label: u.name }))
  const teamOptions = teams.map((t) => ({ value: t.id, label: t.name }))

  const submitSprint = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sprintForm.name.trim() || !sprintForm.teamId) {
      toast.error('Sprint name and team required')
      return
    }
    addSprint({ ...sprintForm, name: sprintForm.name.trim() })
    toast.success('Sprint created')
    setSprintModalOpen(false)
    setSprintForm(defaultSprint(defaultTeamId))
  }

  return (
    <PageFrame
      title="Goals & workload"
      description="OKRs, sprints, time tracking, and capacity"
      accent="emerald"
      bodyClassName="grid gap-6 lg:grid-cols-2"
      actions={
        <>
          <Button variant="secondary" onClick={() => setSprintModalOpen(true)} disabled={!defaultTeamId}>
            <Plus size={16} />
            Add sprint
          </Button>
          <Button onClick={openCreate}>
            <Plus size={16} />
            Add goal
          </Button>
        </>
      }
    >
        <article className="panel panel-pad">
          <h2 className="mb-4 font-semibold text-text">OKRs</h2>
          {goals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No goals yet"
              description="Set revenue or activity targets for your team this quarter."
              action={
                <Button onClick={openCreate}>
                  <Plus size={16} />
                  Add goal
                </Button>
              }
            />
          ) : (
            <ul className="space-y-4">
              {goals.map((g) => {
                const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0
                const owner = users.find((u) => u.id === g.ownerId)
                return (
                  <li key={g.id} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-text">{g.title}</p>
                        <p className="text-xs text-text-muted">
                          {g.quarter}
                          {owner ? ` · ${owner.name}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" className="!p-2" onClick={() => openEdit(g)} aria-label="Edit">
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          className="!p-2 text-rose-600"
                          aria-label="Delete"
                          onClick={() =>
                            deleteConfirm(toast.askConfirm, g.title, () => {
                              deleteGoal(g.id)
                              toast.success('Goal deleted')
                            })
                          }
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    <p className="mb-1 flex justify-between text-sm text-text-muted">
                      <span>{pct}%</span>
                      <span>
                        {formatCurrency(g.current)} / {formatCurrency(g.target)}
                      </span>
                    </p>
                    <div className="progress-track">
                      <div className="progress-fill transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </article>
        <article className="panel panel-pad">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-text">Sprints</h2>
            <Button variant="secondary" className="!py-1.5 text-xs" onClick={() => setSprintModalOpen(true)} disabled={!defaultTeamId}>
              <Plus size={14} /> New
            </Button>
          </div>
          {sprints.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No sprints yet"
              description="Group tasks into a two-week sprint for your team."
              action={
                <Button variant="secondary" onClick={() => setSprintModalOpen(true)} disabled={!defaultTeamId}>
                  <Plus size={16} /> Add sprint
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {sprints.map((s) => (
                <li key={s.id} className="list-item p-3 text-sm">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-text-muted">
                    {s.start} → {s.end} · {tasks.filter((t) => t.sprintId === s.id).length} tasks
                  </p>
                </li>
              ))}
            </ul>
          )}
          <h2 className="mb-2 mt-6 font-semibold text-text">Workload by rep</h2>
          {users.map((u) => {
            const open = tasks.filter((t) => t.ownerId === u.id && t.status !== 'done').length
            const mins = timeEntries
              .filter((e) => e.userId === u.id)
              .reduce((s, e) => s + e.minutes, 0)
            return (
              <p key={u.id} className="text-sm text-text">
                {u.name}: {open} open tasks · {mins} min logged
              </p>
            )
          })}
        </article>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit goal' : 'New goal'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="goal-form">
              {editing ? 'Save' : 'Create goal'}
            </Button>
          </>
        }
      >
        <form id="goal-form" className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Goal title"
            required
            placeholder="e.g. Q2 new business revenue"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Select
            label="Quarter"
            value={form.quarter}
            onChange={(e) => setForm({ ...form, quarter: e.target.value })}
            options={QUARTERS.map((q) => ({ value: q, label: q }))}
          />
          <Select
            label="Owner"
            value={form.ownerId}
            onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
            options={userOptions}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Target ($)"
              type="number"
              min={1}
              required
              value={form.target || ''}
              onChange={(e) => setForm({ ...form, target: Number(e.target.value) || 0 })}
            />
            <Input
              label="Current progress ($)"
              type="number"
              min={0}
              value={form.current || ''}
              onChange={(e) => setForm({ ...form, current: Number(e.target.value) || 0 })}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={sprintModalOpen}
        onClose={() => setSprintModalOpen(false)}
        title="New sprint"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSprintModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="sprint-form">
              Create sprint
            </Button>
          </>
        }
      >
        <form id="sprint-form" className="space-y-4" onSubmit={submitSprint}>
          <Input
            label="Sprint name"
            required
            value={sprintForm.name}
            onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
            placeholder="e.g. Sprint 25 — Q2 push"
          />
          {teamOptions.length > 0 && (
            <Select
              label="Team"
              value={sprintForm.teamId}
              onChange={(e) => setSprintForm({ ...sprintForm, teamId: e.target.value })}
              options={teamOptions}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start date"
              type="date"
              required
              value={sprintForm.start}
              onChange={(e) => setSprintForm({ ...sprintForm, start: e.target.value })}
            />
            <Input
              label="End date"
              type="date"
              required
              value={sprintForm.end}
              onChange={(e) => setSprintForm({ ...sprintForm, end: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </PageFrame>
  )
}
