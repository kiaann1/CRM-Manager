import { Pencil, Plus, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { ImportExportBar } from '../components/ImportExportBar'
import { ListFilterBar } from '../components/ListFilterBar'
import { useEntityListFilters } from '../hooks/useEntityListFilters'
import { PageFrame } from '../components/layout/PageFrame'
import { RecordDrawer } from '../components/RecordDrawer'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { TagPicker } from '../components/TagPicker'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import type { Lead, LeadStage } from '../types'
import { USER_SARAH } from '../lib/ids'
import { badgeClass } from '../lib/theme'

const STAGES = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'disqualified', label: 'Disqualified' },
]

export function LeadsPage() {
  const { leads, users, addLead, updateLead, convertLead, deleteLead, getUser } = useCrm()
  const toast = useToast()
  const filters = useEntityListFilters('leads')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [drawer, setDrawer] = useState<Lead | null>(null)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', company: '', stage: 'new' as LeadStage,
    ownerId: USER_SARAH, source: 'Manual', utmSource: '', utmMedium: '', utmCampaign: '',
    convertedContactId: null as string | null, tagIds: [] as string[],
  })

  const openCreate = () => {
    setEditing(null)
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      stage: 'new' as LeadStage,
      ownerId: USER_SARAH,
      source: 'Manual',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      convertedContactId: null,
      tagIds: [],
    })
    setModal(true)
  }

  const openEdit = (l: Lead) => {
    setEditing(l)
    setForm({
      firstName: l.firstName,
      lastName: l.lastName,
      email: l.email,
      phone: l.phone,
      company: l.company,
      stage: l.stage,
      ownerId: l.ownerId,
      source: l.source,
      utmSource: l.utmSource,
      utmMedium: l.utmMedium,
      utmCampaign: l.utmCampaign,
      convertedContactId: l.convertedContactId,
      tagIds: l.tagIds,
    })
    setModal(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateLead(editing.id, form)
      toast.success('Lead updated')
    } else {
      addLead(form)
      toast.success('Lead created')
    }
    setModal(false)
  }

  return (
    <PageFrame
      title="Leads"
      description="Qualify, score, and convert inbound prospects"
      accent="sky"
      actions={
        <>
          <ImportExportBar entity="leads" />
          <Button onClick={openCreate}>
            <Plus size={16} /> Add lead
          </Button>
        </>
      }
    >
        <ListFilterBar
          query={filters.query}
          onQueryChange={filters.setQuery}
          stage={filters.stage}
          onStageChange={filters.setStage}
          stageOptions={STAGES.filter((s) => s.value).map((s) => s)}
          minScore={filters.minScore}
          onMinScoreChange={filters.setMinScore}
          saved={filters.saved}
          onSave={filters.saveCurrent}
          onApply={filters.apply}
          onRemove={filters.remove}
        />
        {leads.filter((l) => {
          const q = filters.query.toLowerCase()
          const matchQ =
            !q ||
            `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
            l.email.toLowerCase().includes(q)
          const matchStage = !filters.stage || l.stage === filters.stage
          const matchScore = filters.minScore === '' || l.score >= filters.minScore
          return matchQ && matchStage && matchScore
        }).length === 0 && leads.length > 0 ? (
          <p className="text-sm text-text-muted">No leads match your filters.</p>
        ) : leads.length === 0 ? (
          <EmptyState icon={Users} title="No leads" description="Capture leads from forms or import CSV." action={<Button onClick={openCreate}>Add lead</Button>} />
        ) : (
          <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th className="px-4 py-3">Name</th><th>Score</th><th>Stage</th><th>Source</th><th>UTM</th><th>Owner</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-slate-700">
              {leads
                .filter((l) => {
                  const q = filters.query.toLowerCase()
                  const matchQ =
                    !q ||
                    `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
                    l.email.toLowerCase().includes(q)
                  const matchStage = !filters.stage || l.stage === filters.stage
                  const matchScore = filters.minScore === '' || l.score >= filters.minScore
                  return matchQ && matchStage && matchScore
                })
                .map((l) => (
                <tr key={l.id} className="table-row-hover">
                  <td className="px-4 py-3 font-medium"><button type="button" className="text-brand-600" onClick={() => setDrawer(l)}>{l.firstName} {l.lastName}</button></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badgeClass(l.score >= 70 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600')}`}>{l.score}</span></td>
                  <td className="px-4 py-3 capitalize">{l.stage}</td>
                  <td className="px-4 py-3">{l.source}</td>
                  <td className="px-4 py-3 text-text-muted">{l.utmSource}/{l.utmCampaign || '—'}</td>
                  <td className="px-4 py-3">{getUser(l.ownerId)?.name}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" className="!px-2" onClick={() => openEdit(l)} aria-label="Edit">
                      <Pencil size={16} />
                    </Button>
                    {l.stage !== 'converted' && (
                      <Button
                        variant="ghost"
                        className="!px-2"
                        onClick={async () => {
                          try {
                            await convertLead(l.id)
                            toast.success('Lead converted to contact')
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Convert failed')
                          }
                        }}
                      >
                        <UserPlus size={16} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="!px-2 text-rose-600"
                      onClick={() =>
                        deleteConfirm(
                          toast.askConfirm,
                          `${l.firstName} ${l.lastName}`.trim(),
                          () => {
                            deleteLead(l.id)
                            toast.success('Lead deleted')
                          },
                        )
                      }
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit lead' : 'New lead'}
        footer={
          <Button type="submit" form="lead-f">
            {editing ? 'Save' : 'Create'}
          </Button>
        }
      >
        <form id="lead-f" className="space-y-3" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Input label="UTM Source" value={form.utmSource} onChange={(e) => setForm({ ...form, utmSource: e.target.value })} />
          <Select
            label="Stage"
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value as LeadStage })}
            options={STAGES.filter((s) => s.value).map((s) => s)}
          />
          <Select label="Owner" value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} options={users.map((u) => ({ value: u.id, label: u.name }))} />
          <TagPicker value={form.tagIds} onChange={(tagIds) => setForm({ ...form, tagIds })} />
        </form>
      </Modal>
      {drawer && (
        <RecordDrawer
          recordType="lead"
          recordId={drawer.id}
          title={`${drawer.firstName} ${drawer.lastName}`}
          onClose={() => setDrawer(null)}
        />
      )}
    </PageFrame>
  )
}
