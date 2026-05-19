import { Plus, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { ImportExportBar } from '../components/ImportExportBar'
import { PageHeader } from '../components/layout/PageHeader'
import { RecordDrawer } from '../components/RecordDrawer'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import type { Lead } from '../types'
import { USER_SARAH } from '../lib/ids'

export function LeadsPage() {
  const { leads, users, addLead, convertLead, deleteLead, getUser } = useCrm()
  const toast = useToast()
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState<Lead | null>(null)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', company: '', stage: 'new' as const,
    ownerId: USER_SARAH, source: 'Manual', utmSource: '', utmMedium: '', utmCampaign: '',
    convertedContactId: null as string | null, tagIds: [] as string[],
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    addLead(form)
    toast.success('Lead created')
    setModal(false)
  }

  return (
    <div>
      <PageHeader title="Leads" description="Qualify, score, and convert inbound prospects" actions={
        <>
          <ImportExportBar entity="leads" />
          <Button onClick={() => setModal(true)}><Plus size={16} /> Add lead</Button>
        </>
      } />
      <div className="p-8">
        {leads.length === 0 ? (
          <EmptyState icon={Users} title="No leads" description="Capture leads from forms or import CSV." action={<Button onClick={() => setModal(true)}>Add lead</Button>} />
        ) : (
          <table className="w-full rounded-xl border border-border bg-surface text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <thead className="bg-surface-muted text-left text-text-muted dark:bg-slate-800">
              <tr><th className="px-4 py-3">Name</th><th>Score</th><th>Stage</th><th>Source</th><th>UTM</th><th>Owner</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-slate-700">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-surface-muted dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium"><button type="button" className="text-brand-600" onClick={() => setDrawer(l)}>{l.firstName} {l.lastName}</button></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${l.score >= 70 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100'}`}>{l.score}</span></td>
                  <td className="px-4 py-3 capitalize">{l.stage}</td>
                  <td className="px-4 py-3">{l.source}</td>
                  <td className="px-4 py-3 text-text-muted">{l.utmSource}/{l.utmCampaign || '—'}</td>
                  <td className="px-4 py-3">{getUser(l.ownerId)?.name}</td>
                  <td className="px-4 py-3 text-right">
                    {l.stage !== 'converted' && (
                      <Button
                        variant="ghost"
                        className="!px-2"
                        onClick={() => {
                          convertLead(l.id)
                          toast.success('Lead converted to contact')
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
        )}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="New lead" footer={<Button type="submit" form="lead-f">Create</Button>}>
        <form id="lead-f" className="space-y-3" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Input label="UTM Source" value={form.utmSource} onChange={(e) => setForm({ ...form, utmSource: e.target.value })} />
          <Select label="Owner" value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} options={users.map((u) => ({ value: u.id, label: u.name }))} />
        </form>
      </Modal>
      {drawer && <RecordDrawer recordType="lead" recordId={drawer.id} title={`${drawer.firstName} ${drawer.lastName}`} onClose={() => setDrawer(null)} />}
    </div>
  )
}
