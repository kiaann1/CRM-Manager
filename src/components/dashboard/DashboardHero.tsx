import { ArrowRight, Inbox, Plus, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'

function greeting(firstName: string) {
  const h = new Date().getHours()
  const period = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${period}, ${firstName}`
}

export function DashboardHero({
  firstName,
  openDeals,
  pendingTasks,
  overdueTasks,
}: {
  firstName: string
  openDeals: number
  pendingTasks: number
  overdueTasks: number
}) {
  const name = firstName || 'there'

  return (
    <section className="relative overflow-hidden rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600 via-brand-600 to-violet-700 px-6 py-8 text-white shadow-lg shadow-brand-600/20 dark:border-brand-800/50 dark:from-brand-700 dark:via-brand-800 dark:to-violet-900 dark:shadow-brand-950/40 sm:px-8 sm:py-10">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-brand-100">Your command center</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {greeting(name)}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-brand-100/90">
            {openDeals > 0 ? (
              <>
                You have <strong className="font-semibold text-white">{openDeals}</strong> open{' '}
                {openDeals === 1 ? 'deal' : 'deals'}
                {pendingTasks > 0 && (
                  <>
                    {' '}
                    and <strong className="font-semibold text-white">{pendingTasks}</strong>{' '}
                    {pendingTasks === 1 ? 'task' : 'tasks'} due
                  </>
                )}
                . Here&apos;s what needs attention today.
              </>
            ) : (
              <>Start by adding a deal or contact — your pipeline overview will appear here.</>
            )}
          </p>
          {overdueTasks > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              {overdueTasks} overdue {overdueTasks === 1 ? 'task' : 'tasks'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/deals">
            <Button className="!border-0 !bg-white !text-brand-700 shadow-md hover:!bg-brand-50">
              <Plus size={16} /> New deal
            </Button>
          </Link>
          <Link to="/contacts">
            <Button
              variant="secondary"
              className="!border-white/25 !bg-white/10 !text-white backdrop-blur-sm hover:!bg-white/20"
            >
              <UserPlus size={16} /> Add contact
            </Button>
          </Link>
          <Link to="/inbox">
            <Button
              variant="secondary"
              className="!border-white/25 !bg-white/10 !text-white backdrop-blur-sm hover:!bg-white/20"
            >
              <Inbox size={16} /> Inbox
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative mt-6 flex justify-end border-t border-white/15 pt-5 text-sm">
        <Link
          to="/reports"
          className="inline-flex items-center gap-1 font-medium text-white hover:underline"
        >
          View reports <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  )
}
