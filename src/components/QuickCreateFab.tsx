import { Handshake, Plus, UserPlus, ListTodo } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'

type QuickKind = 'contact' | 'deal' | 'task' | null

export function QuickCreateFab() {
  const crm = useCrm()
  const toast = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [kind, setKind] = useState<QuickKind>(null)
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')

  const ownerId = crm.currentUser?.id ?? crm.users[0]?.id ?? ''

  const start = (k: QuickKind) => {
    setKind(k)
    setTitle('')
    setEmail('')
    setOpen(true)
    setMenuOpen(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!kind || !title.trim()) return
    if (kind === 'contact') {
      if (!email.trim()) {
        toast.error('Email required')
        return
      }
      const parts = title.trim().split(/\s+/)
      crm.addContact({
        firstName: parts[0] ?? title,
        lastName: parts.slice(1).join(' '),
        email: email.trim(),
        phone: '',
        companyId: null,
        title: '',
        ownerId,
        leadId: null,
        tagIds: [],
      })
      toast.success('Contact created')
    }
    if (kind === 'deal') {
      crm.addDeal({
        title: title.trim(),
        value: 10000,
        stage: 'lead',
        pipelineId: crm.pipelines[0]?.id ?? '',
        contactId: null,
        companyId: null,
        ownerId,
        expectedClose: new Date().toISOString().slice(0, 10),
        tagIds: [],
        slaDue: null,
      })
      toast.success('Deal created')
      navigate('/deals')
    }
    if (kind === 'task') {
      crm.addTask({
        title: title.trim(),
        description: '',
        dueDate: new Date().toISOString().slice(0, 10),
        priority: 'medium',
        status: 'todo',
        contactId: null,
        dealId: null,
        ownerId,
        parentId: null,
        dependsOn: [],
        recurring: 'none',
        estimateMinutes: 30,
        loggedMinutes: 0,
        sprintId: null,
        goalId: null,
        checklist: [],
        tagIds: [],
      })
      toast.success('Task created')
      navigate('/tasks')
    }
    setOpen(false)
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {menuOpen && (
          <div className="rounded-xl border border-border bg-surface p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-muted"
              onClick={() => start('contact')}
            >
              <UserPlus size={16} /> Contact
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-muted"
              onClick={() => start('deal')}
            >
              <Handshake size={16} /> Deal
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-muted"
              onClick={() => start('task')}
            >
              <ListTodo size={16} /> Task
            </button>
          </div>
        )}
        <button
          type="button"
          aria-label="Quick create"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-xl shadow-brand-600/35 transition hover:scale-105 hover:shadow-brand-600/45 active:scale-95"
        >
          <Plus size={24} className={menuOpen ? 'rotate-45 transition' : 'transition'} />
        </button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          kind === 'contact' ? 'New contact' : kind === 'deal' ? 'New deal' : 'New task'
        }
      >
        <form className="space-y-4" onSubmit={submit}>
          <Input
            label={kind === 'contact' ? 'Name' : 'Title'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
          {kind === 'contact' && (
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
