import {
  ArrowUpRight,
  Building2,
  Calendar,
  DollarSign,
  Handshake,
  ListTodo,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ActivityFeed } from '../components/dashboard/ActivityFeed'
import { DashboardHero } from '../components/dashboard/DashboardHero'
import { DashboardPanel } from '../components/dashboard/DashboardPanel'
import { PipelineFunnel } from '../components/dashboard/PipelineFunnel'
import { RecordDrawer } from '../components/RecordDrawer'
import { StatCard } from '../components/StatCard'
import { useCrm } from '../context/CrmContext'
import { getNextBestActions } from '../lib/ai'
import { formatCurrency, fullName } from '../lib/format'
import { dealVelocityDays, weightedPipelineValue } from '../lib/pipeline'
import { USER_SARAH } from '../lib/ids'

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '?'
}

function stageBadgeClass(crm: ReturnType<typeof useCrm>, stage: string) {
  return crm.pipelineStages.find((s) => s.key === stage)?.color ?? 'bg-slate-100 text-slate-700'
}

export function Dashboard() {
  const crm = useCrm()
  const { contacts, companies, deals, tasks, leads, session, pipelineStages, getContact, getCompany } =
    crm
  const [drawerDealId, setDrawerDealId] = useState<string | null>(null)

  const aiActions = getNextBestActions(crm, session?.userId ?? USER_SARAH)
  const firstName = crm.currentUser?.name.split(' ')[0] ?? ''

  const openDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost')
  const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0)
  const forecast = weightedPipelineValue(crm)
  const wonValue = deals.filter((d) => d.stage === 'won').reduce((sum, d) => sum + d.value, 0)
  const winRate =
    deals.filter((d) => d.stage === 'won' || d.stage === 'lost').length > 0
      ? Math.round(
          (deals.filter((d) => d.stage === 'won').length /
            deals.filter((d) => d.stage === 'won' || d.stage === 'lost').length) *
            100,
        )
      : 0
  const velocity = dealVelocityDays(deals)

  const pendingTasks = tasks.filter((t) => t.status !== 'done')
  const overdueTasks = pendingTasks.filter(
    (t) => new Date(t.dueDate) < new Date(new Date().toDateString()),
  )

  const recentDeals = [...deals]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  const hotLeads = [...leads]
    .filter((l) => l.stage !== 'converted' && l.stage !== 'disqualified')
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const drawerDeal = drawerDealId ? deals.find((d) => d.id === drawerDealId) : undefined

  const quickLinks = [
    { to: '/contacts', icon: Users, label: 'Contacts', desc: 'Relationships' },
    { to: '/companies', icon: Building2, label: 'Companies', desc: 'Accounts' },
    { to: '/tasks', icon: ListTodo, label: 'Tasks', desc: 'To-dos & follow-ups' },
    { to: '/automations', icon: Zap, label: 'Automations', desc: 'Workflows' },
    { to: '/calendar', icon: Calendar, label: 'Calendar', desc: 'Meetings' },
    { to: '/goals', icon: Target, label: 'Goals', desc: 'Quotas' },
  ]

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50/80 via-surface-muted to-surface-muted dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <DashboardHero
          firstName={firstName}
          openDeals={openDeals.length}
          pendingTasks={pendingTasks.length}
          overdueTasks={overdueTasks.length}
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Pipeline"
            value={formatCurrency(pipelineValue)}
            subtext={`${openDeals.length} open deals`}
            icon={DollarSign}
            accent="indigo"
          />
          <StatCard
            label="Forecast"
            value={formatCurrency(forecast)}
            subtext="Probability-weighted"
            icon={TrendingUp}
            accent="violet"
          />
          <StatCard
            label="Won revenue"
            value={formatCurrency(wonValue)}
            subtext={winRate ? `${winRate}% win rate` : 'Closed-won'}
            icon={Handshake}
            accent="emerald"
          />
          <StatCard
            label="Contacts"
            value={String(contacts.length)}
            subtext={`${companies.length} companies`}
            icon={Users}
            accent="sky"
          />
          <StatCard
            label="Tasks"
            value={String(pendingTasks.length)}
            subtext={
              overdueTasks.length > 0
                ? `${overdueTasks.length} overdue`
                : velocity != null
                  ? `~${velocity}d avg close`
                  : 'On track'
            }
            icon={ListTodo}
            accent="amber"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-50 via-white to-indigo-50/50 p-6 shadow-sm dark:border-violet-900/40 dark:from-violet-950/40 dark:via-slate-900 dark:to-indigo-950/30">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md shadow-brand-500/30">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h2 className="font-semibold tracking-tight text-text">Today&apos;s priorities</h2>
                  <p className="text-xs text-text-muted">Suggested follow-ups for your pipeline</p>
                </div>
              </div>
              <ol className="mt-5 space-y-2.5">
                {aiActions.map((action, i) => (
                  <li
                    key={action}
                    className="flex gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/50"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-text-muted leading-snug">{action}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <Link
                  to="/leads"
                  className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
                >
                  {leads.filter((l) => l.stage !== 'converted').length} active leads
                  <ArrowUpRight size={14} />
                </Link>
                <span className="text-border">|</span>
                <Link
                  to="/deals"
                  className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
                >
                  Open pipeline
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-2">
            {[
              {
                label: 'Pipeline stages',
                value: String(pipelineStages.filter((s) => s.key !== 'lost').length),
                href: '/deals',
              },
              {
                label: 'Hot leads (70+)',
                value: String(leads.filter((l) => l.score >= 70 && l.stage !== 'converted').length),
                href: '/leads',
              },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center justify-between rounded-2xl border border-border/80 bg-surface px-5 py-4 shadow-sm transition hover:border-brand-200 hover:shadow-md dark:border-slate-700 dark:hover:border-brand-800"
              >
                <span className="text-sm font-medium text-text-muted">{item.label}</span>
                <span className="flex items-center gap-1 text-2xl font-bold text-text">
                  {item.value}
                  <ArrowUpRight size={16} className="text-brand-500" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityFeed limit={10} />
          </div>
          <PipelineFunnel />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <DashboardPanel
            title="Recent deals"
            description="Latest opportunities"
            noPadding
            action={
              <Link to="/deals" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          >
            <ul className="divide-y divide-border/80">
              {recentDeals.length === 0 ? (
                <li className="px-5 py-10 text-center text-sm text-text-muted">
                  No deals yet —{' '}
                  <Link to="/deals" className="font-medium text-brand-600">
                    create your first
                  </Link>
                </li>
              ) : (
                recentDeals.map((deal) => {
                  const contact = deal.contactId ? getContact(deal.contactId) : undefined
                  const company = deal.companyId ? getCompany(deal.companyId) : undefined
                  const stageLabel =
                    pipelineStages.find((s) => s.key === deal.stage)?.label ?? deal.stage
                  return (
                    <li key={deal.id}>
                      <button
                        type="button"
                        className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-surface-muted/80"
                        onClick={() => setDrawerDealId(deal.id)}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          {deal.title.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-text group-hover:text-brand-600">
                            {deal.title}
                          </p>
                          <p className="truncate text-xs text-text-muted">
                            {company?.name ?? 'No company'}
                            {contact &&
                              ` · ${fullName(contact.firstName, contact.lastName)}`}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-text">{formatCurrency(deal.value)}</p>
                          <span
                            className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${stageBadgeClass(crm, deal.stage)}`}
                          >
                            {stageLabel}
                          </span>
                        </div>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </DashboardPanel>

          <DashboardPanel
            title="Hot leads"
            description="Highest scores first"
            noPadding
            action={
              <Link to="/leads" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all
              </Link>
            }
          >
            <ul className="divide-y divide-border/80">
              {hotLeads.length === 0 ? (
                <li className="px-5 py-10 text-center text-sm text-text-muted">No active leads</li>
              ) : (
                hotLeads.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      to="/leads"
                      className="flex items-center gap-4 px-5 py-4 transition hover:bg-surface-muted/80"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-orange-500 text-xs font-bold text-white shadow-sm">
                        {initials(lead.firstName, lead.lastName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text">
                          {fullName(lead.firstName, lead.lastName)}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {lead.company || lead.email}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          lead.score >= 70
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                        }`}
                      >
                        {lead.score}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </DashboardPanel>
        </section>

        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Quick access
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {quickLinks.map(({ to, icon: Icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col gap-3 rounded-2xl border border-border/80 bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-slate-700 dark:hover:border-brand-800"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950 dark:text-brand-300 dark:group-hover:bg-brand-600 dark:group-hover:text-white">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-text">{label}</p>
                  <p className="text-xs text-text-muted">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {drawerDeal && (
        <RecordDrawer
          recordType="deal"
          recordId={drawerDeal.id}
          title={drawerDeal.title}
          emailTo={drawerDeal.contactId ? getContact(drawerDeal.contactId)?.email : undefined}
          onClose={() => setDrawerDealId(null)}
        />
      )}
    </div>
  )
}
