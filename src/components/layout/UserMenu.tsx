import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCrm } from '../../context/CrmContext'
import { userInitials } from '../../lib/format'

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  rep: 'Sales rep',
  guest: 'Guest',
  readonly: 'Read only',
}

export function UserMenu() {
  const { currentUser, teams, logout } = useCrm()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!currentUser) return null

  const teamName = teams.find((t) => t.id === currentUser.teamId)?.name
  const initials = userInitials(currentUser.name)

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-border py-1 pl-1 pr-2 text-sm hover:bg-surface-muted dark:border-slate-700 dark:hover:bg-slate-800"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {currentUser.avatar ? (
          <img
            src={currentUser.avatar}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {initials}
          </span>
        )}
        <span className="hidden max-w-[8rem] truncate font-medium text-text sm:inline">
          {currentUser.name.split(' ')[0]}
        </span>
        <ChevronDown
          size={14}
          className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-xl dark:border-slate-700 dark:bg-slate-900"
            role="menu"
          >
            <div className="border-b border-border bg-surface-muted/50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text">{currentUser.name}</p>
                  <p className="truncate text-xs text-text-muted">{currentUser.email}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800 dark:bg-brand-950 dark:text-brand-200">
                  {roleLabels[currentUser.role] ?? currentUser.role}
                </span>
                {teamName && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {teamName}
                  </span>
                )}
              </div>
            </div>

            <nav className="p-1.5">
              <Link
                to="/settings?tab=Profile"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text hover:bg-surface-muted dark:hover:bg-slate-800"
                onClick={() => setOpen(false)}
              >
                <User size={16} className="text-text-muted" />
                Account settings
              </Link>
              <Link
                to="/settings?tab=Notifications"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text hover:bg-surface-muted dark:hover:bg-slate-800"
                onClick={() => setOpen(false)}
              >
                <Bell size={16} className="text-text-muted" />
                Notifications
              </Link>
              <Link
                to="/settings"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text hover:bg-surface-muted dark:hover:bg-slate-800"
                onClick={() => setOpen(false)}
              >
                <Settings size={16} className="text-text-muted" />
                All settings
              </Link>
            </nav>

            <div className="border-t border-border p-1.5 dark:border-slate-700">
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                onClick={() => void handleLogout()}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
