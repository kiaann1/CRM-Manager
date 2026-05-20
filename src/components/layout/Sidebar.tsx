import {
  BarChart3,
  Building2,
  Calendar,
  CheckSquare,
  Columns,
  FileText,
  Handshake,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Package,
  Plug,
  Settings,
  Target,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useCrm } from '../../context/CrmContext'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: number }

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'CRM',
    items: [
      { to: '/contacts', label: 'Contacts', icon: Users },
      { to: '/leads', label: 'Leads', icon: UserPlus },
      { to: '/companies', label: 'Companies', icon: Building2 },
      { to: '/deals', label: 'Deals', icon: Handshake },
      { to: '/products', label: 'Products', icon: Package },
    ],
  },
  {
    title: 'Work',
    items: [
      { to: '/tasks', label: 'Tasks', icon: CheckSquare },
      { to: '/boards', label: 'Boards', icon: Columns },
      { to: '/calendar', label: 'Calendar', icon: Calendar },
      { to: '/goals', label: 'Goals', icon: Target },
      { to: '/docs', label: 'Docs', icon: FileText },
    ],
  },
  {
    title: 'Growth',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/automations', label: 'Automations', icon: Zap },
      { to: '/marketing', label: 'Marketing', icon: Megaphone },
    ],
  },
  {
    title: 'Connect',
    items: [
      { to: '/inbox', label: 'Inbox', icon: Inbox },
      { to: '/support', label: 'Support', icon: LifeBuoy },
      { to: '/integrations', label: 'Integrations', icon: Plug },
    ],
  },
]

export function Sidebar({
  id,
  mobileOpen = false,
  onCloseMobile,
}: {
  id?: string
  mobileOpen?: boolean
  onCloseMobile?: () => void
}) {
  const { currentUser, notifications, inbox, session } = useCrm()

  const unreadNotifs = notifications.filter((n) => n.userId === session?.userId && !n.read).length
  const unreadInbox = inbox.filter((m) => !m.read).length

  const itemsWithBadges = sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.to === '/inbox') return { ...item, badge: unreadInbox || undefined }
      return item
    }),
  }))

  const afterNav = () => {
    onCloseMobile?.()
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[35] cursor-default bg-slate-900/45 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      )}
      <aside
        id={id}
        className={[
          'glass-panel flex shrink-0 flex-col border-r border-border/80',
          'fixed inset-y-0 left-0 z-40 h-dvh w-[min(17.5rem,88vw)] max-w-[280px] transition-transform duration-200 ease-out lg:static lg:z-auto lg:h-full lg:min-h-0 lg:max-w-none lg:w-[15.5rem] lg:translate-x-0 lg:visible lg:pointer-events-auto',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full max-lg:pointer-events-none max-lg:invisible',
        ].join(' ')}
      >
      <div className="flex items-center gap-3 border-b border-border/80 px-4 py-4">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-lg shadow-brand-600/25">
          <Handshake size={20} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="font-display truncate text-sm font-bold tracking-tight text-text">CRM Manager</p>
          <p className="truncate text-xs text-text-muted">{currentUser?.name ?? 'Guest'}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {itemsWithBadges.map((section) => (
          <div key={section.title} className="mb-3">
            <p className="nav-section-label">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, end, badge }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={afterNav}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'nav-link-active' : ''}`
                    }
                  >
                    <Icon size={16} strokeWidth={2} />
                    <span className="flex-1 truncate">{label}</span>
                    {badge != null && badge > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/80 p-2">
        <NavLink
          to="/settings"
          onClick={afterNav}
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
        >
          <Settings size={16} />
          <span className="flex-1">Settings</span>
          {unreadNotifs > 0 && (
            <span className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-surface" aria-label="Unread notifications" />
          )}
        </NavLink>
      </div>
    </aside>
    </>
  )
}
