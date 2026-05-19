import { Building2, DollarSign, Handshake, ListTodo, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatCard } from '../components/StatCard'
import { PageHeader } from '../components/layout/PageHeader'
import { useCrm } from '../context/CrmContext'
import { formatCurrency, formatDate, fullName } from '../lib/format'
import { getNextBestActions } from '../lib/ai'
import { USER_SARAH } from '../lib/ids'

export function Dashboard() {
  const crm = useCrm()
  const { contacts, companies, deals, tasks, leads, session, getContact, getCompany } = crm
  const aiActions = getNextBestActions(crm, session?.userId ?? USER_SARAH)

  const openDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost')
  const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0)
  const wonValue = deals
    .filter((d) => d.stage === 'won')
    .reduce((sum, d) => sum + d.value, 0)
  const pendingTasks = tasks.filter((t) => t.status !== 'done')
  const overdueTasks = pendingTasks.filter(
    (t) => new Date(t.dueDate) < new Date(new Date().toDateString()),
  )

  const recentDeals = [...deals]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your pipeline and activity"
      />
      <div className="space-y-8 p-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pipeline value"
            value={formatCurrency(pipelineValue)}
            subtext={`${openDeals.length} open deals`}
            icon={DollarSign}
          />
          <StatCard
            label="Won revenue"
            value={formatCurrency(wonValue)}
            subtext="Closed-won deals"
            icon={Handshake}
          />
          <StatCard
            label="Contacts"
            value={String(contacts.length)}
            subtext={`${companies.length} companies`}
            icon={Users}
          />
          <StatCard
            label="Tasks due"
            value={String(pendingTasks.length)}
            subtext={
              overdueTasks.length > 0
                ? `${overdueTasks.length} overdue`
                : 'Stay on track'
            }
            icon={ListTodo}
          />
        </section>

        <section className="rounded-xl border border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900 dark:bg-brand-950/30">
          <h2 className="font-semibold text-text dark:text-white">AI next-best actions</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
            {aiActions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <Link to="/leads" className="font-medium text-brand-600">
              {leads.filter((l) => l.stage !== 'converted').length} active leads
            </Link>
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold text-text">Recent deals</h2>
              <Link
                to="/deals"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {recentDeals.map((deal) => {
                const contact = deal.contactId
                  ? getContact(deal.contactId)
                  : undefined
                const company = deal.companyId
                  ? getCompany(deal.companyId)
                  : undefined
                return (
                  <li
                    key={deal.id}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-text">{deal.title}</p>
                      <p className="text-xs text-text-muted">
                        {company?.name ?? 'No company'}
                        {contact &&
                          ` · ${fullName(contact.firstName, contact.lastName)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-text">
                        {formatCurrency(deal.value)}
                      </p>
                      <p className="text-xs capitalize text-text-muted">
                        {deal.stage}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold text-text">Upcoming tasks</h2>
              <Link
                to="/tasks"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {pendingTasks.length === 0 ? (
                <li className="px-5 py-8 text-center text-sm text-text-muted">
                  No pending tasks
                </li>
              ) : (
                pendingTasks
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .slice(0, 5)
                  .map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between px-5 py-3.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-text">{task.title}</p>
                        <p className="text-xs capitalize text-text-muted">
                          {task.priority} priority
                        </p>
                      </div>
                      <p className="text-xs text-text-muted">
                        {formatDate(task.dueDate)}
                      </p>
                    </li>
                  ))
              )}
            </ul>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/contacts"
            className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
          >
            <Users className="text-brand-600" size={28} />
            <div>
              <p className="font-semibold text-text">Manage contacts</p>
              <p className="text-sm text-text-muted">Add and organize people</p>
            </div>
          </Link>
          <Link
            to="/companies"
            className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
          >
            <Building2 className="text-brand-600" size={28} />
            <div>
              <p className="font-semibold text-text">Manage companies</p>
              <p className="text-sm text-text-muted">Accounts and organizations</p>
            </div>
          </Link>
        </section>
      </div>
    </div>
  )
}
