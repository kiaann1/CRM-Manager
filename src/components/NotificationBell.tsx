import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useCrm } from '../context/CrmContext'

export function NotificationBell() {
  const { notifications, session, markNotificationRead, markAllNotificationsRead } = useCrm()
  const [open, setOpen] = useState(false)
  const mine = notifications.filter((n) => n.userId === session?.userId)
  const unread = mine.filter((n) => !n.read).length

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-surface shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-slate-700">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  className="text-xs font-medium text-brand-600 hover:underline"
                  onClick={() => markAllNotificationsRead()}
                >
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {mine.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-text-muted">All caught up</li>
              ) : (
                mine.slice(0, 12).map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-surface-muted dark:hover:bg-slate-800 ${n.read ? 'opacity-60' : ''}`}
                      onClick={() => markNotificationRead(n.id)}
                    >
                      <p className="font-medium">{n.title}</p>
                      <p className="text-text-muted">{n.body}</p>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
