import { Building2, CheckSquare, FileText, Handshake, Loader2, Search, Target, Users } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommandPalette } from '../context/CommandPaletteContext'
import { useCrm } from '../context/CrmContext'
import { api } from '../lib/api/client'
import { fullName } from '../lib/format'

const pages = [
  { label: 'Dashboard', path: '/' },
  { label: 'Contacts', path: '/contacts' },
  { label: 'Leads', path: '/leads' },
  { label: 'Companies', path: '/companies' },
  { label: 'Deals', path: '/deals' },
  { label: 'Products', path: '/products' },
  { label: 'Tasks', path: '/tasks' },
  { label: 'Boards', path: '/boards' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Goals', path: '/goals' },
  { label: 'Docs', path: '/docs' },
  { label: 'Reports', path: '/reports' },
  { label: 'Automations', path: '/automations' },
  { label: 'Integrations', path: '/integrations' },
  { label: 'Inbox', path: '/inbox' },
  { label: 'Settings', path: '/settings' },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-2">
      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">{title}</p>
      {children}
    </div>
  )
}

function Item({
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  icon: typeof Search
  label: string
  sub?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-brand-500/10"
      onClick={onClick}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-muted">
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-text">{label}</span>
        {sub && <span className="block truncate text-xs text-text-muted">{sub}</span>}
      </span>
    </button>
  )
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette()
  const [q, setQ] = useState('')
  const [remote, setRemote] = useState<Awaited<ReturnType<typeof api.search>> | null>(null)
  const [searching, setSearching] = useState(false)
  const navigate = useNavigate()
  const crm = useCrm()

  useEffect(() => {
    if (!open) {
      setQ('')
      setRemote(null)
    }
  }, [open])

  useEffect(() => {
    const ql = q.trim()
    if (ql.length < 2) {
      setRemote(null)
      setSearching(false)
      return
    }
    setSearching(true)
    const t = window.setTimeout(() => {
      api
        .search(ql)
        .then(setRemote)
        .catch(() => setRemote(null))
        .finally(() => setSearching(false))
    }, 200)
    return () => window.clearTimeout(t)
  }, [q])

  const results = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (!ql) {
      return {
        nav: pages.slice(0, 8),
        contacts: crm.contacts.slice(0, 4),
        companies: crm.companies.slice(0, 4),
        deals: crm.deals.slice(0, 4),
        tasks: crm.tasks.slice(0, 4),
        leads: crm.leads.slice(0, 4),
        documents: crm.documents.slice(0, 4),
      }
    }

    if (remote && ql.length >= 2) {
      return {
        nav: pages.filter((p) => p.label.toLowerCase().includes(ql)),
        contacts: remote.contacts,
        companies: remote.companies,
        deals: remote.deals,
        tasks: crm.tasks
          .filter((t) => `${t.title} ${t.description}`.toLowerCase().includes(ql))
          .slice(0, 6),
        leads: remote.leads,
        documents: remote.documents,
      }
    }

    const match = (text: string) => text.toLowerCase().includes(ql)
    return {
      nav: pages.filter((p) => match(p.label)),
      contacts: crm.contacts
        .filter((c) => match(`${c.firstName} ${c.lastName} ${c.email} ${c.title}`))
        .slice(0, 6),
      companies: crm.companies
        .filter((c) => match(`${c.name} ${c.industry} ${c.website}`))
        .slice(0, 6),
      deals: crm.deals.filter((d) => match(d.title)).slice(0, 6),
      tasks: crm.tasks.filter((t) => match(`${t.title} ${t.description}`)).slice(0, 6),
      leads: crm.leads
        .filter((l) => match(`${l.firstName} ${l.lastName} ${l.email} ${l.company}`))
        .slice(0, 6),
      documents: crm.documents
        .filter((d) => match(`${d.title} ${d.content}`))
        .slice(0, 6),
    }
  }, [q, crm, remote])

  if (!open) return null

  const go = (path: string) => {
    navigate(path)
    setOpen(false)
    setQ('')
  }

  const hasResults =
    results.nav.length > 0 ||
    results.contacts.length > 0 ||
    results.companies.length > 0 ||
    results.deals.length > 0 ||
    results.tasks.length > 0 ||
    results.leads.length > 0 ||
    results.documents.length > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/60 p-4 pt-[10vh] backdrop-blur-md"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className="glass-panel w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/20 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search"
      >
        <div className="flex items-center gap-2 border-b border-border/80 px-4">
          <Search size={18} className="shrink-0 text-brand-600" />
          <input
            autoFocus
            placeholder="Search contacts, deals, pages…"
            className="form-control flex-1 border-0 bg-transparent py-4 shadow-none focus:ring-0"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {searching && <Loader2 size={16} className="animate-spin text-text-muted" />}
          <kbd className="hidden rounded-md border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline">
            esc
          </kbd>
        </div>
        <div className="max-h-[min(26rem,55vh)] overflow-y-auto p-2">
          {results.nav.length > 0 && (
            <Section title="Pages">
              {results.nav.map((p) => (
                <Item key={p.path} icon={Search} label={p.label} onClick={() => go(p.path)} />
              ))}
            </Section>
          )}
          {results.contacts.length > 0 && (
            <Section title="Contacts">
              {results.contacts.map((c) => (
                <Item
                  key={c.id}
                  icon={Users}
                  label={fullName(c.firstName, c.lastName)}
                  sub={c.email}
                  onClick={() => go('/contacts')}
                />
              ))}
            </Section>
          )}
          {results.companies.length > 0 && (
            <Section title="Companies">
              {results.companies.map((c) => (
                <Item
                  key={c.id}
                  icon={Building2}
                  label={c.name}
                  sub={c.industry}
                  onClick={() => go('/companies')}
                />
              ))}
            </Section>
          )}
          {results.deals.length > 0 && (
            <Section title="Deals">
              {results.deals.map((d) => (
                <Item key={d.id} icon={Handshake} label={d.title} onClick={() => go('/deals')} />
              ))}
            </Section>
          )}
          {results.leads.length > 0 && (
            <Section title="Leads">
              {results.leads.map((l) => (
                <Item
                  key={l.id}
                  icon={Target}
                  label={fullName(l.firstName, l.lastName)}
                  sub={l.email}
                  onClick={() => go('/leads')}
                />
              ))}
            </Section>
          )}
          {results.tasks.length > 0 && (
            <Section title="Tasks">
              {results.tasks.map((t) => (
                <Item key={t.id} icon={CheckSquare} label={t.title} onClick={() => go('/tasks')} />
              ))}
            </Section>
          )}
          {results.documents.length > 0 && (
            <Section title="Docs">
              {results.documents.map((d) => (
                <Item key={d.id} icon={FileText} label={d.title} onClick={() => go(`/docs/${d.id}`)} />
              ))}
            </Section>
          )}
          {!hasResults && q.trim() && !searching && (
            <p className="px-3 py-10 text-center text-sm text-text-muted">
              No results for &ldquo;{q}&rdquo;
            </p>
          )}
        </div>
        <div className="border-t border-border/80 px-4 py-2 text-center text-[10px] text-text-muted">
          Server search when you type 2+ characters
        </div>
      </div>
    </div>
  )
}
