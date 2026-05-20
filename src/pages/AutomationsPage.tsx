import { Plus, Trash2, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageFrame } from '../components/layout/PageFrame'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import { describeRule } from '../lib/automations'
import type { AutomationAction, DealStage } from '../types'

export function AutomationsPage() {
  const {
    automations,
    addAutomation,
    updateAutomation,
    deleteAutomation,
    webhooks,
    integrations,
    emailSequences,
    approvals,
    pipelineStages,
    respondApproval,
    getUser,
    currentUser,
  } = useCrm()
  const toast = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [stage, setStage] = useState<DealStage>('proposal')
  const [actionType, setActionType] = useState<'notify' | 'create_task'>('notify')
  const [actionTitle, setActionTitle] = useState('Follow up on proposal')

  const stageOptions = [...pipelineStages]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ value: s.key, label: s.label }))

  const createRule = () => {
    if (!name.trim()) {
      toast.error('Name required')
      return
    }
    const actions: AutomationAction[] =
      actionType === 'create_task'
        ? [{ type: 'create_task', title: actionTitle.trim() || 'Follow-up task' }]
        : [{ type: 'notify', message: `Deal entered ${stage}` }]
    addAutomation({
      name: name.trim(),
      enabled: true,
      trigger: { type: 'deal_stage_changed', stage },
      actions,
    })
    setCreateOpen(false)
    setName('')
    toast.success('Automation created')
  }

  return (
    <PageFrame
      title="Automations"
      description="Workflows, sequences, webhooks, integrations, and approvals"
      accent="rose"
      bodyClassName="grid gap-6 lg:grid-cols-2"
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> New rule
        </Button>
      }
    >
        <section className="panel panel-pad">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Zap size={18} /> Rules
          </h2>
          <ul className="space-y-3">
            {automations.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 list-item p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-text-muted">
                    {describeRule(r)} · {r.actions.length} action(s)
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={r.enabled}
                      onChange={(e) => {
                        updateAutomation(r.id, { enabled: e.target.checked })
                        toast.success(e.target.checked ? 'Automation enabled' : 'Automation paused')
                      }}
                    />
                    On
                  </label>
                  <Button
                    variant="ghost"
                    className="!p-2 text-rose-600"
                    onClick={() =>
                      deleteConfirm(toast.askConfirm, r.name, () => {
                        deleteAutomation(r.id)
                        toast.success('Automation deleted')
                      })
                    }
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </li>
            ))}
            {!automations.length && (
              <p className="text-sm text-text-muted">No rules yet. Create one when a deal hits a stage.</p>
            )}
          </ul>
        </section>
        <section className="space-y-4">
          <div className="panel panel-pad">
            <h2 className="mb-3 font-semibold">Email sequences</h2>
            {emailSequences.length === 0 ? (
              <p className="text-sm text-text-muted">No sequences — refresh after first load for a sample nurture flow.</p>
            ) : (
              emailSequences.map((s) => (
                <p key={s.id} className="text-sm">
                  {s.name} — {s.steps.length} steps {s.enabled ? '✓' : ''}
                </p>
              ))
            )}
          </div>
          <div className="panel panel-pad">
            <h2 className="mb-3 font-semibold">Webhooks & API</h2>
            {webhooks.length === 0 ? (
              <p className="text-sm text-text-muted">
                No outbound webhooks.{' '}
                <Link to="/settings?tab=Webhooks" className="font-medium text-brand-600 hover:underline">
                  Add one in Settings
                </Link>
                .
              </p>
            ) : (
              webhooks.map((w) => (
                <p key={w.id} className="truncate text-sm text-text-muted">
                  {w.url} ({w.events.join(', ')})
                </p>
              ))
            )}
            <p className="mt-2 text-xs text-text-muted">
              API keys:{' '}
              <Link to="/settings?tab=Security" className="text-brand-600 hover:underline">
                Settings → Security
              </Link>
            </p>
          </div>
          <div className="panel panel-pad">
            <h2 className="mb-3 font-semibold">Integrations</h2>
            {integrations.length === 0 ? (
              <p className="text-sm text-text-muted">
                <Link to="/integrations" className="text-brand-600 hover:underline">
                  Open Integrations
                </Link>{' '}
                to connect Slack, HubSpot, and more.
              </p>
            ) : (
              integrations.map((i) => (
                <div key={i.id} className="flex justify-between py-1 text-sm">
                  <span>{i.name}</span>
                  <span className={i.enabled ? 'text-emerald-600' : 'text-text-muted'}>
                    {i.enabled ? 'On' : 'Off'}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="panel panel-pad">
            <h2 className="mb-3 font-semibold">Pending approvals</h2>
            {approvals
              .filter((a) => a.status === 'pending')
              .map((a) => (
                <div
                  key={a.id}
                  className="mb-3 list-item p-3"
                >
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-text-muted">
                    {getUser(a.requesterId)?.name} → {getUser(a.approverId)?.name}
                  </p>
                  {a.approverId === currentUser?.id && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        className="!py-1 text-xs"
                        onClick={() => {
                          respondApproval(a.id, 'approved')
                          toast.success('Approved')
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        className="!py-1 text-xs"
                        onClick={() => {
                          respondApproval(a.id, 'rejected')
                          toast.info('Declined')
                        }}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            {!approvals.filter((a) => a.status === 'pending').length && (
              <p className="text-sm text-text-muted">None pending</p>
            )}
          </div>
        </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New automation">
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select
            label="When deal stage becomes"
            value={stage}
            onChange={(e) => setStage(e.target.value as DealStage)}
            options={stageOptions}
          />
          <Select
            label="Then"
            value={actionType}
            onChange={(e) => setActionType(e.target.value as 'notify' | 'create_task')}
            options={[
              { value: 'notify', label: 'Notify deal owner' },
              { value: 'create_task', label: 'Create follow-up task' },
            ]}
          />
          {actionType === 'create_task' && (
            <Input
              label="Task title"
              value={actionTitle}
              onChange={(e) => setActionTitle(e.target.value)}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createRule}>Create</Button>
          </div>
        </div>
      </Modal>
    </PageFrame>
  )
}
