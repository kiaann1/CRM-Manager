import { Handshake } from 'lucide-react'
import type { CSSProperties } from 'react'

function Bone({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={`skeleton-bone rounded-lg bg-slate-200/90 dark:bg-slate-800/90 ${className}`}
      style={style}
      aria-hidden
    />
  )
}

const navWidths = ['w-[72%]', 'w-[58%]', 'w-[64%]', 'w-[52%]', 'w-[68%]', 'w-[48%]', 'w-[56%]', 'w-[44%]']
const chartHeights = ['h-10', 'h-16', 'h-12', 'h-20', 'h-14', 'h-24', 'h-[4.5rem]']

export function WorkspaceLoader() {
  return (
    <div
      className="workspace-loader flex min-h-screen bg-surface-muted dark:bg-slate-950"
      role="status"
      aria-live="polite"
      aria-label="Loading workspace"
    >
      <div className="workspace-loader-bar" aria-hidden />

      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-4 dark:border-slate-800">
          <div className="relative flex h-9 w-9 items-center justify-center">
            <span className="absolute inset-0 rounded-lg bg-brand-600/20 animate-ping opacity-40" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-lg shadow-brand-600/30">
              <Handshake size={18} className="workspace-loader-icon" />
            </span>
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <Bone className="h-3.5 w-24" />
            <Bone className="h-2.5 w-16" />
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navWidths.map((w, i) => (
            <div
              key={w}
              className="workspace-loader-nav-row flex items-center gap-2.5 rounded-lg px-2.5 py-2"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Bone className="h-4 w-4 shrink-0 rounded-md" />
              <Bone className={`h-3 ${w}`} />
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3 dark:border-slate-800">
          <Bone className="h-8 w-full" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-2 border-b border-border bg-surface px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
          <Bone className="h-9 w-44 rounded-lg" />
          <Bone className="h-9 w-9 rounded-lg" />
        </header>

        <main className="flex-1 overflow-hidden p-8">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-3">
                <Bone className="h-8 w-56 max-w-full" />
                <Bone className="h-4 w-80 max-w-full" />
              </div>
              <Bone className="h-10 w-32 rounded-lg" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="workspace-loader-card rounded-2xl border border-border bg-surface p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  style={{ animationDelay: `${120 + i * 80}ms` }}
                >
                  <Bone className="h-3 w-20" />
                  <Bone className="mt-4 h-8 w-28" />
                  <Bone className="mt-3 h-3 w-16" />
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="rounded-2xl border border-border bg-surface p-5 lg:col-span-3 dark:border-slate-800 dark:bg-slate-900">
                <Bone className="h-4 w-32" />
                <div className="mt-6 space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Bone className="h-9 w-9 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Bone className="h-3 w-full max-w-md" />
                        <Bone className="h-2.5 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                <Bone className="h-4 w-28" />
                <div className="mt-6 flex h-28 items-end justify-between gap-2 px-2">
                  {chartHeights.map((h, i) => (
                    <Bone key={i} className={`w-full max-w-8 rounded-t-md ${h}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="workspace-loader-caption mt-10 text-center text-sm font-medium text-text-muted">
            Loading workspace
            <span className="workspace-loader-dots" aria-hidden>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </p>
        </main>
      </div>
    </div>
  )
}
