import { Search } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { CommandPalette } from '../CommandPalette'
import { NotificationBell } from '../NotificationBell'
import { CommandPaletteProvider, useCommandPalette } from '../../context/CommandPaletteContext'
import { QuickCreateFab } from '../QuickCreateFab'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

function AppHeader() {
  const { setOpen } = useCommandPalette()

  return (
    <header className="glass-panel sticky top-0 z-30 flex items-center gap-3 border-b border-border/80 px-4 py-2.5">
      <button type="button" onClick={() => setOpen(true)} className="search-trigger">
        <Search size={16} className="shrink-0 opacity-60" />
        <span className="flex-1 text-left">Search anything…</span>
        <kbd className="hidden rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline">
          ⌘K
        </kbd>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  )
}

export function AppLayout() {
  return (
    <CommandPaletteProvider>
      <div className="app-mesh flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="page-content flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
        <CommandPalette />
        <QuickCreateFab />
      </div>
    </CommandPaletteProvider>
  )
}
