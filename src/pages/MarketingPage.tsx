import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import { formatCurrency } from '../lib/format'
import type { Campaign } from '../types'

type CampaignForm = Omit<Campaign, 'id'>

const emptyCampaign: CampaignForm = {
  name: '',
  utmSource: '',
  utmMedium: '',
  budget: 0,
}

export function MarketingPage() {
  const { forms, campaigns, leads, emailSequences, addCampaign, updateCampaign, deleteCampaign } =
    useCrm()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [form, setForm] = useState<CampaignForm>(emptyCampaign)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyCampaign)
    setModalOpen(true)
  }

  const openEdit = (c: Campaign) => {
    setEditing(c)
    setForm({
      name: c.name,
      utmSource: c.utmSource,
      utmMedium: c.utmMedium,
      budget: c.budget,
    })
    setModalOpen(true)
  }

  const save = () => {
    if (!form.name.trim()) {
      toast.error('Campaign name required')
      return
    }
    if (editing) {
      updateCampaign(editing.id, form)
      toast.success('Campaign updated')
    } else {
      addCampaign(form)
      toast.success('Campaign created')
    }
    setModalOpen(false)
  }

  const leadsForCampaign = (utmSource: string) =>
    leads.filter((l) => l.utmSource === utmSource).length

  return (
    <div>
      <PageHeader
        title="Marketing"
        description="Forms, campaigns, UTM attribution, nurture sequences"
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> New campaign
          </Button>
        }
      />
      <div className="page-shell grid gap-6 lg:grid-cols-2">
        <section className="panel panel-pad">
          <h2 className="mb-4 font-semibold">Lead capture forms</h2>
          {forms.map((f) => (
            <div
              key={f.id}
              className="mb-4 list-item p-4"
            >
              <p className="font-medium">{f.name}</p>
              <p className="text-xs text-text-muted">
                {f.fields.length} fields · {f.submissions.length} submissions
              </p>
              <p className="mt-2 text-xs">Embed: /embed/form/{f.id}</p>
            </div>
          ))}
        </section>
        <section className="panel panel-pad">
          <h2 className="mb-4 font-semibold">Campaigns & attribution</h2>
          {campaigns.length === 0 ? (
            <p className="text-sm text-text-muted">No campaigns yet.</p>
          ) : (
            <ul className="space-y-3">
              {campaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start justify-between gap-2 list-item p-3"
                >
                  <div>
                    <p className="flex items-center gap-1 text-sm font-medium">
                      <Megaphone size={14} />
                      {c.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {c.utmSource || '—'}/{c.utmMedium || '—'} · {formatCurrency(c.budget)} ·{' '}
                      {leadsForCampaign(c.utmSource)} leads
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" className="!p-2" onClick={() => openEdit(c)} aria-label="Edit">
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="!p-2 text-rose-600"
                      onClick={() =>
                        deleteConfirm(toast.askConfirm, c.name, () => {
                          deleteCampaign(c.id)
                          toast.success('Campaign deleted')
                        })
                      }
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-6 mb-2 text-sm font-medium">Leads by UTM</h3>
          {leads.slice(0, 8).map((l) => (
            <p key={l.id} className="text-xs text-text-muted">
              {l.email}: {l.utmSource || 'direct'}
            </p>
          ))}
        </section>
        <section className="panel panel-pad lg:col-span-2">
          <h2 className="mb-2 font-semibold">Meeting scheduler & live chat</h2>
          <p className="text-sm text-text-muted">
            Scheduler link: /book/demo · Chat widget captures visitors as leads.
          </p>
          <p className="mt-2 text-sm">
            Active nurture sequences:{' '}
            {emailSequences
              .filter((s) => s.enabled)
              .map((s) => s.name)
              .join(', ') || 'None'}
          </p>
        </section>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit campaign' : 'New campaign'}
      >
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input
            label="UTM source"
            value={form.utmSource}
            onChange={(e) => setForm({ ...form, utmSource: e.target.value })}
          />
          <Input
            label="UTM medium"
            value={form.utmMedium}
            onChange={(e) => setForm({ ...form, utmMedium: e.target.value })}
          />
          <Input
            label="Budget"
            type="number"
            min={0}
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: Number(e.target.value) || 0 })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
