import { GripVertical, Handshake, Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState, type DragEvent } from 'react'
import { DealInlineFields } from '../components/deals/DealInlineFields'
import { DealTableRow } from '../components/deals/DealTableRow'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import type { Deal, DealStage } from '../types'
import { formatCurrency } from '../lib/format'
import { ImportExportBar } from '../components/ImportExportBar'
import { RecordDrawer } from '../components/RecordDrawer'
import { TagPicker } from '../components/TagPicker'
import { ListFilterBar } from '../components/ListFilterBar'
import { useListFilters } from '../hooks/useListFilters'
import { PIPE_DEFAULT } from '../lib/ids'

type DealForm = Omit<Deal, 'id' | 'createdAt'>

function emptyForm(ownerId: string, pipelineId: string): DealForm {
  return {
    title: '',
    value: 0,
    stage: 'lead',
    pipelineId,
    contactId: null,
    companyId: null,
    ownerId,
    expectedClose: new Date().toISOString().slice(0, 10),
    tagIds: [],
    slaDue: null,
  }
}

export function DealsPage() {
  const {
    deals,
    contacts,
    companies,
    users,
    pipelineStages,
    pipelines,
    currentUser,
    addDeal,
    updateDeal,
    deleteDeal,
    moveDeal,
    getContact,
    getCompany,
  } = useCrm()
  const toast = useToast()
  const filters = useListFilters('deals')
  const [modalOpen, setModalOpen] = useState(false)
  const ownerId = currentUser?.id ?? users[0]?.id ?? ''
  const defaultPipelineId = pipelines[0]?.id ?? PIPE_DEFAULT
  const [form, setForm] = useState<DealForm>(() => emptyForm(ownerId, defaultPipelineId))
  const [view, setView] = useState<'board' | 'table'>('board')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DealStage | null>(null)
  const [drawerDealId, setDrawerDealId] = useState<string | null>(null)

  const boardStages = [...pipelineStages]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ id: s.key as DealStage, label: s.label, color: s.color }))

  const filteredDeals = useMemo(() => {
    const q = filters.query.toLowerCase()
    return deals.filter((d) => {
      const matchQ = !q || d.title.toLowerCase().includes(q)
      const matchStage = !filters.stage || d.stage === filters.stage
      return matchQ && matchStage
    })
  }, [deals, filters.query, filters.stage])

  const drawerDeal = drawerDealId ? deals.find((d) => d.id === drawerDealId) : undefined

  const saveDeal = useCallback(
    (id: string, patch: Partial<Deal>) => {
      updateDeal(id, patch)
    },
    [updateDeal],
  )

  const onDragStart = (e: DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/deal-id', dealId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(dealId)
  }

  const onDragEnd = () => {
    setDraggingId(null)
    setDropTarget(null)
  }

  const onDragOverColumn = (e: DragEvent, stage: DealStage) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(stage)
  }

  const onDropColumn = (e: DragEvent, stage: DealStage) => {
    e.preventDefault()
    const dealId = e.dataTransfer.getData('text/deal-id')
    if (dealId) {
      moveDeal(dealId, stage)
      const label = boardStages.find((s) => s.id === stage)?.label
      if (label) toast.info(`Moved to ${label}`)
    }
    onDragEnd()
  }

  const openCreate = () => {
    setForm(emptyForm(ownerId, defaultPipelineId))
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addDeal(form)
    toast.success('Deal created')
    setModalOpen(false)
  }

  const contactOptions = [
    { value: '', label: 'No contact' },
    ...contacts.map((c) => ({
      value: c.id,
      label: `${c.firstName} ${c.lastName}`,
    })),
  ]

  const companyOptions = [
    { value: '', label: 'No company' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <div className="flex min-h-0 flex-col">
      <PageHeader
        title="Deals"
        description="Drag between stages or edit fields inline — no pop-up needed"
        actions={
          <>
            <div className="flex rounded-lg border border-border bg-surface p-0.5">
              <button
                type="button"
                onClick={() => setView('board')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  view === 'board' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'text-text-muted'
                }`}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => setView('table')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  view === 'table' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'text-text-muted'
                }`}
              >
                Table
              </button>
            </div>
            <ImportExportBar entity="deals" />
            <Button onClick={openCreate}>
              <Plus size={16} />
              Add deal
            </Button>
          </>
        }
      />

      {deals.length > 0 && (
        <div className="px-8 pt-4">
          <ListFilterBar
            query={filters.query}
            onQueryChange={filters.setQuery}
            stage={filters.stage}
            onStageChange={filters.setStage}
            stageOptions={boardStages.map((s) => ({ value: s.id, label: s.label }))}
            saved={filters.saved}
            onSave={filters.saveCurrent}
            onApply={filters.apply}
            onRemove={filters.remove}
          />
        </div>
      )}

      {deals.length === 0 ? (
        <div className="page-shell">
          <EmptyState
            icon={Handshake}
            title="No deals yet"
            description="Create your first deal to start tracking revenue."
            action={
              <Button onClick={openCreate}>
                <Plus size={16} />
                Add deal
              </Button>
            }
          />
        </div>
      ) : view === 'board' ? (
        <div className="grid w-full grid-cols-2 gap-2 px-3 pb-4 sm:px-4 md:grid-cols-3 xl:grid-cols-6">
          {boardStages.map((stage) => {
            const columnDeals = filteredDeals.filter((d) => d.stage === stage.id)
            const columnTotal = columnDeals.reduce((s, d) => s + d.value, 0)
            return (
              <section
                key={stage.id}
                className={`flex min-w-0 flex-col rounded-xl border bg-surface-muted transition-colors ${
                  dropTarget === stage.id
                    ? 'border-brand-500 ring-2 ring-brand-500/30'
                    : 'border-border'
                }`}
                onDragOver={(e) => onDragOverColumn(e, stage.id)}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => onDropColumn(e, stage.id)}
              >
                <header className="border-b border-border px-2 py-2 sm:px-3">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`truncate rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${stage.color}`}
                    >
                      {stage.label}
                    </span>
                    <span className="text-[10px] text-text-muted sm:text-xs">{columnDeals.length}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs font-medium text-text sm:text-sm">
                    {formatCurrency(columnTotal)}
                  </p>
                </header>
                <ul className="flex flex-col gap-1.5 p-2">
                  {columnDeals.length === 0 && (
                    <li className="rounded-lg border border-dashed border-border py-6 text-center text-[10px] text-text-muted sm:text-xs">
                      Drop here
                    </li>
                  )}
                  {columnDeals.map((deal) => {
                    const contact = deal.contactId ? getContact(deal.contactId) : undefined
                    return (
                      <li
                        key={deal.id}
                        className={`list-item p-2 ${
                          draggingId === deal.id ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="mb-1.5 flex items-start gap-1">
                          <span
                            draggable
                            onDragStart={(e) => onDragStart(e, deal.id)}
                            onDragEnd={onDragEnd}
                            className="cursor-grab pt-1 text-text-muted active:cursor-grabbing"
                            aria-label="Drag to another stage"
                          >
                            <GripVertical size={14} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <DealInlineFields
                              deal={deal}
                              compact
                              onSave={(patch) => saveDeal(deal.id, patch)}
                              onOpen={() => setDrawerDealId(deal.id)}
                            />
                          </div>
                          <button
                            type="button"
                            className="rounded p-0.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                            aria-label="Delete deal"
                            onClick={() =>
                              deleteConfirm(toast.askConfirm, deal.title, () => {
                                deleteDeal(deal.id)
                                toast.success('Deal deleted')
                              })
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {contact && (
                          <p className="truncate pl-5 text-[10px] text-text-muted">
                            {contact.firstName} {contact.lastName}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="data-table-wrap px-2 pb-4">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr>
                <th className="w-[28%] px-2 py-2 font-medium">Deal</th>
                <th className="w-[12%] px-2 py-2 font-medium">Value</th>
                <th className="w-[14%] px-2 py-2 font-medium">Stage</th>
                <th className="w-[14%] px-2 py-2 font-medium">Close</th>
                <th className="w-[16%] px-2 py-2 font-medium">Contact</th>
                <th className="w-[16%] px-2 py-2 font-medium">Company</th>
                <th className="w-10 px-1 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDeals.map((deal) => {
                const contact = deal.contactId ? getContact(deal.contactId) : undefined
                return (
                  <DealTableRow
                    key={deal.id}
                    deal={deal}
                    contactName={
                      contact ? `${contact.firstName} ${contact.lastName}`.trim() : '—'
                    }
                    companyName={
                      deal.companyId ? getCompany(deal.companyId)?.name ?? '—' : '—'
                    }
                    onSave={(patch) => saveDeal(deal.id, patch)}
                    onOpen={() => setDrawerDealId(deal.id)}
                    onDelete={() =>
                      deleteConfirm(toast.askConfirm, deal.title, () => {
                        deleteDeal(deal.id)
                        toast.success('Deal deleted')
                      })
                    }
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New deal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="deal-form">
              Create
            </Button>
          </>
        }
      >
        <form id="deal-form" className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Deal title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            label="Value (USD)"
            type="number"
            min={0}
            required
            value={form.value || ''}
            onChange={(e) => setForm({ ...form, value: Number(e.target.value) || 0 })}
          />
          <Select
            label="Stage"
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value as DealStage })}
            options={boardStages.map((s) => ({ value: s.id, label: s.label }))}
          />
          <Input
            label="Expected close"
            type="date"
            required
            value={form.expectedClose}
            onChange={(e) => setForm({ ...form, expectedClose: e.target.value })}
          />
          <Select
            label="Contact"
            value={form.contactId ?? ''}
            onChange={(e) => setForm({ ...form, contactId: e.target.value || null })}
            options={contactOptions}
          />
          <Select
            label="Company"
            value={form.companyId ?? ''}
            onChange={(e) => setForm({ ...form, companyId: e.target.value || null })}
            options={companyOptions}
          />
          <Select
            label="Owner"
            value={form.ownerId}
            onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
            options={users.map((u) => ({ value: u.id, label: u.name }))}
          />
          <TagPicker value={form.tagIds} onChange={(tagIds) => setForm({ ...form, tagIds })} />
        </form>
      </Modal>

      {drawerDeal && (
        <RecordDrawer
          recordType="deal"
          recordId={drawerDeal.id}
          title={drawerDeal.title}
          emailTo={
            drawerDeal.contactId ? getContact(drawerDeal.contactId)?.email : undefined
          }
          onClose={() => setDrawerDealId(null)}
        />
      )}
    </div>
  )
}
