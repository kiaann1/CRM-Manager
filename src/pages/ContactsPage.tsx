import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
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
import { RecordDrawer } from '../components/RecordDrawer'
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
  const { contacts, companies, addContact, updateContact, deleteContact, getCompany } = useCrm()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [form, setForm] = useState<ContactForm>(emptyForm)
  const [drawer, setDrawer] = useState<Contact | null>(null)

  const filtered = contacts.filter((c) => {
    const name = fullName(c.firstName, c.lastName).toLowerCase()
    const q = search.toLowerCase()
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
    <div>
      <PageHeader
        title="Contacts"
        description="People you work with across accounts"
        actions={
          <>
            <ImportExportBar entity="contacts" />
            <Button onClick={openCreate}>
              <Plus size={16} />
              Add contact
            </Button>
          </>
        }
      />
      <div className="p-8">
        <input
          type="search"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-control mb-6 max-w-md"
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts found"
            description={
              search
                ? 'Try a different search term.'
                : 'Add your first contact to get started.'
            }
            action={
              !search ? (
                <Button onClick={openCreate}>
                  <Plus size={16} />
                  Add contact
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-text-muted">
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
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit contact' : 'New contact'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="contact-form">
              {editing ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="contact-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              required
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
        </form>
      </Modal>
      {drawer && (
        <RecordDrawer
          recordType="contact"
          recordId={drawer.id}
          title={fullName(drawer.firstName, drawer.lastName)}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  )
}