import { Menu, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { CommandPalette } from '../CommandPalette'
import { NotificationBell } from '../NotificationBell'
import { CommandPaletteProvider, useCommandPalette } from '../../context/CommandPaletteContext'
import { QuickCreateFab } from '../QuickCreateFab'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

function AppHeader({
  mobileNavOpen,
  onToggleMobileNav,
}: {
  mobileNavOpen: boolean
  onToggleMobileNav: () => void
}) {
  const { setOpen } = useCommandPalette()

  return (
    <header className="glass-panel sticky top-0 z-30 flex w-full min-w-0 items-center gap-2 border-b border-border/80 px-3 py-2.5 sm:gap-3 sm:px-6">
      <button
        type="button"
        className="btn-icon shrink-0 lg:hidden"
        onClick={onToggleMobileNav}
        aria-expanded={mobileNavOpen}
        aria-controls="app-sidebar"
        aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="search-trigger min-w-0 flex-1 text-left lg:max-w-none"
      >
        <Search size={16} className="shrink-0 opacity-60" />
        <span className="min-w-0 flex-1 truncate">
          <span className="sm:hidden">Search…</span>
          <span className="hidden sm:inline">Search anything…</span>
        </span>
        <kbd className="hidden shrink-0 rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline">
          ⌘K
        </kbd>
      </button>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  )
}

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!mobileNavOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileNavOpen])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const close = () => {
      if (mq.matches) setMobileNavOpen(false)
    }
    mq.addEventListener('change', close)
    return () => mq.removeEventListener('change', close)
  }, [])

  return (
    <CommandPaletteProvider>
      <div className="app-mesh flex h-dvh max-h-dvh min-h-0 w-full min-w-0 overflow-hidden">
        <Sidebar
          id="app-sidebar"
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader
            mobileNavOpen={mobileNavOpen}
            onToggleMobileNav={() => setMobileNavOpen((o) => !o)}
          />
          <main className="page-content min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
            <Outlet />
          </main>
        </div>
        <CommandPalette />
        <QuickCreateFab />
      </div>
    </CommandPaletteProvider>
  )
}
