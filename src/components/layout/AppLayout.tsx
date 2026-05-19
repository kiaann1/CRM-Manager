import { Search } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { CommandPalette } from '../CommandPalette'
import { NotificationBell } from '../NotificationBell'
import { CommandPaletteProvider, useCommandPalette } from '../../context/CommandPaletteContext'
import { Sidebar } from './Sidebar'

function AppHeader() {
  const { setOpen } = useCommandPalette()

  return (
    <header className="flex items-center justify-end gap-2 border-b border-border bg-surface px-4 py-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-surface-muted dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <Search size={16} />
        Search
        <kbd className="rounded bg-slate-100 px-1.5 text-xs dark:bg-slate-800">⌘K</kbd>
      </button>
      <NotificationBell />
    </header>
  )
}

export function AppLayout() {
  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen bg-surface-muted">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
        <CommandPalette />
      </div>
    </CommandPaletteProvider>
  )
}
