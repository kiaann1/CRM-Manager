import { GitMerge, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { PageFrame } from '../components/layout/PageFrame'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { deleteConfirm } from '../lib/confirm'
import type { Contact } from '../types'
import { fullName } from '../lib/format'
import { ImportExportBar } from '../components/ImportExportBar'
import { ListFilterBar } from '../components/ListFilterBar'
import { RecordDrawer } from '../components/RecordDrawer'
import { TagPicker } from '../components/TagPicker'
import { useEntityListFilters } from '../hooks/useEntityListFilters'
import { USER_SARAH } from '../lib/ids'

type ContactForm = Omit<Contact, 'id' | 'createdAt'>

const emptyForm: ContactForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  companyId: null,
  title: '',
  ownerId: USER_SARAH,
  tagIds: [],
  leadId: null,
}

export function ContactsPage() {
  const { contacts, companies, addContact, updateContact, deleteContact, getCompany, mergeContacts } =
    useCrm()
  const toast = useToast()
  const filters = useEntityListFilters('contacts')
  const [modalOpen, setModalOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergePrimary, setMergePrimary] = useState('')
  const [mergeDuplicate, setMergeDuplicate] = useState('')
  const [editing, setEditing] = useState<Contact | null>(null)
  const [form, setForm] = useState<ContactForm>(emptyForm)
  const [drawer, setDrawer] = useState<Contact | null>(null)

  const filtered = contacts.filter((c) => {
    const name = fullName(c.firstName, c.lastName).toLowerCase()
    const q = filters.query.toLowerCase()
    if (!q) return true
    return (
      name.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q)
    )
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (contact: Contact) => {
    setEditing(contact)
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      companyId: contact.companyId,
      title: contact.title,
      ownerId: contact.ownerId,
      tagIds: contact.tagIds,
      leadId: contact.leadId,
    })
    setModalOpen(true)
  }

  const saveContact = () => {
    if (!form.firstName.trim() || !form.email.trim()) {
      toast.error('First name and email are required')
      return
    }
    if (editing) {
      updateContact(editing.id, form)
      toast.success('Contact updated')
    } else {
      addContact(form)
      toast.success('Contact created')
    }
    setModalOpen(false)
  }

  const companyOptions = [
    { value: '', label: 'No company' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <PageFrame
      title="Contacts"
      description="People you work with across accounts"
      accent="violet"
      actions={
        <>
          <ImportExportBar entity="contacts" />
          {contacts.length >= 2 && (
            <Button variant="secondary" onClick={() => setMergeOpen(true)}>
              <GitMerge size={16} /> Merge
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus size={16} />
            Add contact
          </Button>
        </>
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
            icon={Users}
            title="No contacts found"
            description={
              filters.query
                ? 'Try a different search term.'
                : 'Add your first contact to get started.'
            }
            action={
              !filters.query ? (
                <Button onClick={openCreate}>
                  <Plus size={16} />
                  Add contact
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((contact) => (
                  <tr key={contact.id} className="table-row-hover">
                    <td className="px-5 py-3.5 font-medium text-text">
                      <button type="button" className="text-brand-600 hover:underline" onClick={() => setDrawer(contact)}>
                        {fullName(contact.firstName, contact.lastName)}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-text-muted">{contact.email}</td>
                    <td className="px-5 py-3.5 text-text-muted">
                      {contact.companyId
                        ? getCompany(contact.companyId)?.name ?? '—'
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-text-muted">{contact.title || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="!p-2"
                          onClick={() => openEdit(contact)}
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          className="!p-2 text-rose-600 hover:bg-rose-50"
                          onClick={() =>
                            deleteConfirm(
                              toast.askConfirm,
                              fullName(contact.firstName, contact.lastName),
                              () => {
                                deleteContact(contact.id)
                                toast.success('Contact deleted')
                              },
                            )
                          }
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit contact' : 'New contact'}
        canAdvanceFromStep={(step) =>
          step === 0 ? Boolean(form.firstName.trim() && form.email.trim()) : true
        }
        footer={<Button onClick={saveContact}>{editing ? 'Save' : 'Create'}</Button>}
        steps={[
          {
            id: 'identity',
            label: 'Identity',
            content: (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="First name"
                    required
                    autoFocus
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                  <Input
                    label="Last name"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  label="Job title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
            ),
          },
          {
            id: 'company',
            label: 'Company & tags',
            content: (
              <div className="space-y-4">
                <Select
                  label="Company"
                  value={form.companyId ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      companyId: e.target.value || null,
                    })
                  }
                  options={companyOptions}
                />
                <TagPicker value={form.tagIds} onChange={(tagIds) => setForm({ ...form, tagIds })} />
              </div>
            ),
          },
        ]}
      />
      <Modal
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        title="Merge contacts"
        footer={
          <Button
            onClick={() => {
              if (!mergePrimary || !mergeDuplicate || mergePrimary === mergeDuplicate) {
                toast.error('Pick two different contacts')
                return
              }
              mergeContacts(mergePrimary, mergeDuplicate)
              toast.success('Contacts merged')
              setMergeOpen(false)
              setMergePrimary('')
              setMergeDuplicate('')
            }}
          >
            Merge
          </Button>
        }
      >
        <p className="mb-4 text-sm text-text-muted">
          Keeps the primary contact and moves timeline, tasks, and deals from the duplicate.
        </p>
        <div className="space-y-4">
          <Select
            label="Keep (primary)"
            value={mergePrimary}
            onChange={(e) => setMergePrimary(e.target.value)}
            options={[
              { value: '', label: 'Select…' },
              ...contacts.map((c) => ({
                value: c.id,
                label: fullName(c.firstName, c.lastName),
              })),
            ]}
          />
          <Select
            label="Merge into primary (will be deleted)"
            value={mergeDuplicate}
            onChange={(e) => setMergeDuplicate(e.target.value)}
            options={[
              { value: '', label: 'Select…' },
              ...contacts
                .filter((c) => c.id !== mergePrimary)
                .map((c) => ({
                  value: c.id,
                  label: fullName(c.firstName, c.lastName),
                })),
            ]}
          />
        </div>
      </Modal>
      {drawer && (
        <RecordDrawer
          recordType="contact"
          recordId={drawer.id}
          title={fullName(drawer.firstName, drawer.lastName)}
          onClose={() => setDrawer(null)}
        />
      )}
    </PageFrame>
  )
}