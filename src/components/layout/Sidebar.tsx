import {
  BarChart3,
  Building2,
  Calendar,
  CheckSquare,
  Columns,
  FileText,
  Handshake,
  Inbox,
  Package,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Plug,
  Settings,
  Target,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useCrm } from '../../context/CrmContext'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/leads', label: 'Leads', icon: UserPlus },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/deals', label: 'Deals', icon: Handshake },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/boards', label: 'Boards', icon: Columns },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/automations', label: 'Automations', icon: Zap },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/support', label: 'Support', icon: LifeBuoy },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/docs', label: 'Docs', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { currentUser } = useCrm()

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Handshake size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text">CRM Manager</p>
          <p className="truncate text-xs text-text-muted">{currentUser?.name ?? 'Guest'}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-text-muted hover:bg-surface-muted hover:text-text'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
