import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageFrame } from '../components/layout/PageFrame'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { ListFilterBar } from '../components/ListFilterBar'
import { RecordDrawer } from '../components/RecordDrawer'
import { useListFilters } from '../hooks/useListFilters'
import { deleteConfirm } from '../lib/confirm'
import type { Company } from '../types'

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Professional services',
  'Education',
  'Other',
]

type CompanyForm = Omit<Company, 'id' | 'createdAt'>

function emptyForm(ownerId: string): CompanyForm {
  return {
    name: '',
    industry: '',
    website: '',
    phone: '',
    parentId: null,
    ownerId,
    territoryId: null,
    healthScore: 70,
    tagIds: [],
  }
}

export function CompaniesPage() {
  const {
    companies,
    contacts,
    users,
    territories,
    addCompany,
    updateCompany,
    deleteCompany,
    currentUser,
  } = useCrm()
  const toast = useToast()
  const filters = useListFilters('companies')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [form, setForm] = useState<CompanyForm>(() =>
    emptyForm(currentUser?.id ?? users[0]?.id ?? ''),
  )
  const [drawerCompanyId, setDrawerCompanyId] = useState<string | null>(null)
  const drawerCompany = drawerCompanyId
    ? companies.find((c) => c.id === drawerCompanyId)
    : undefined

  const ownerId = currentUser?.id ?? users[0]?.id ?? ''

  const filtered = companies.filter((c) => {
    const q = filters.query.toLowerCase()
    if (!q) return true
    return c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q)
  })

  const contactCount = (companyId: string) =>
    contacts.filter((c) => c.companyId === companyId).length

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm(ownerId))
    setModalOpen(true)
  }

  const openEdit = (company: Company) => {
    setEditing(company)
    setForm({
      name: company.name,
      industry: company.industry,
      website: company.website,
      phone: company.phone,
      parentId: company.parentId,
      ownerId: company.ownerId,
      territoryId: company.territoryId,
      healthScore: company.healthScore,
      tagIds: company.tagIds,
    })
    setModalOpen(true)
  }

  const saveCompany = () => {
    if (!form.name.trim()) return
    const payload = { ...form, name: form.name.trim() }
    if (editing) {
      updateCompany(editing.id, payload)
      toast.success('Company updated')
    } else {
      addCompany(payload)
      toast.success('Company created')
    }
    setModalOpen(false)
  }

  const parentOptions = [
    { value: '', label: 'No parent company' },
    ...companies
      .filter((c) => c.id !== editing?.id)
      .map((c) => ({ value: c.id, label: c.name })),
  ]

  const ownerOptions = users.map((u) => ({ value: u.id, label: u.name }))
  const territoryOptions = [
    { value: '', label: 'No territory' },
    ...territories.map((t) => ({ value: t.id, label: t.name })),
  ]

  return (
    <PageFrame
      title="Companies"
      description="Organizations and accounts in your CRM"
      accent="emerald"
      actions={
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add company
        </Button>
      }
    >
        <ListFilterBar
          query={filters.query}
          onQueryChange={filters.setQuery}
          saved={filters.saved}
          onSave={filters.saveCurrent}
          onApply={filters.apply}
          onRemove={filters.remove}
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No companies found"
            description={
              filters.query
                ? 'Try a different search term.'
                : 'Add your first company to get started.'
            }
            action={
              !filters.query ? (
                <Button onClick={openCreate}>
                  <Plus size={16} />
                  Add company
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="page-card-grid">
            {filtered.map((company) => (
              <article key={company.id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-text">{company.name}</h3>
                    <p className="text-sm text-text-muted">{company.industry || '—'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => setDrawerCompanyId(company.id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      className="!p-2"
                      onClick={() => openEdit(company)}
                      aria-label="Edit"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="!p-2 text-rose-600"
                      onClick={() =>
                        deleteConfirm(toast.askConfirm, company.name, () => {
                          deleteCompany(company.id)
                          toast.success('Company deleted')
                        })
                      }
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <dl className="mt-4 space-y-1 text-sm">
                  {company.website && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-text-muted">Website</dt>
                      <dd className="truncate text-text">{company.website}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <dt className="text-text-muted">Health</dt>
                    <dd className="font-medium text-text">{company.healthScore}%</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-text-muted">Contacts</dt>
                    <dd className="font-medium text-text">{contactCount(company.id)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit company' : 'Add company'}
        canAdvanceFromStep={(step) => (step === 0 ? Boolean(form.name.trim()) : true)}
        footer={
          <Button onClick={saveCompany} disabled={!form.name.trim()}>
            {editing ? 'Save changes' : 'Create company'}
          </Button>
        }
        steps={[
          {
            id: 'details',
            label: 'Details',
            content: (
              <fieldset className="space-y-4">
                <p className="text-xs text-text-muted">
                  Start with the company name — you can add contacts after saving.
                </p>
                <Input
                  label="Company name"
                  required
                  autoFocus
                  placeholder="Acme Corporation"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-text">Industry</span>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => setForm({ ...form, industry: ind })}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                          form.industry === ind
                            ? 'bg-brand-600 text-white'
                            : 'bg-surface-muted text-text-muted hover:text-text'
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                  <input
                    className="form-control"
                    placeholder="Or type a custom industry"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    list="industry-list"
                  />
                  <datalist id="industry-list">
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind} />
                    ))}
                  </datalist>
                </label>
              </fieldset>
            ),
          },
          {
            id: 'contact',
            label: 'Contact',
            content: (
              <fieldset className="space-y-4">
                <Input
                  label="Website"
                  type="url"
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="+1 555 0100"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </fieldset>
            ),
          },
          {
            id: 'ownership',
            label: 'Ownership',
            content: (
              <fieldset className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Account owner"
                    value={form.ownerId}
                    onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
                    options={ownerOptions}
                  />
                  <Select
                    label="Territory"
                    value={form.territoryId ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, territoryId: e.target.value || null })
                    }
                    options={territoryOptions}
                  />
                </div>
                <Select
                  label="Parent company"
                  value={form.parentId ?? ''}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value || null })}
                  options={parentOptions}
                />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-text">
                    Account health score: {form.healthScore}%
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.healthScore}
                    onChange={(e) =>
                      setForm({ ...form, healthScore: Number(e.target.value) })
                    }
                    className="w-full accent-brand-600"
                  />
                </label>
              </fieldset>
            ),
          },
        ]}
      />

      {drawerCompany && (
        <RecordDrawer
          recordType="company"
          recordId={drawerCompany.id}
          title={drawerCompany.name}
          onClose={() => setDrawerCompanyId(null)}
        />
      )}
    </PageFrame>
  )
}
