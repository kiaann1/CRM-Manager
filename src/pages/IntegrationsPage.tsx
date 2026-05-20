import { useMemo } from 'react'
import { IntegrationCard } from '../components/integrations/IntegrationCard'
import { PageFrame } from '../components/layout/PageFrame'
import { useCrm } from '../context/CrmContext'

const categoryOrder = ['communication', 'calendar', 'automation', 'crm', 'billing'] as const

const categoryTitles: Record<string, string> = {
  communication: 'Team chat',
  calendar: 'Email & calendar',
  automation: 'Workflow automation',
  crm: 'CRM platforms',
  billing: 'Payments',
}

export function IntegrationsPage() {
  const crm = useCrm()

  const grouped = useMemo(() => {
    const map = new Map<string, typeof crm.integrations>()
    for (const i of crm.integrations) {
      const cat = i.category ?? 'automation'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(i)
    }
    return categoryOrder
      .filter((c) => map.has(c))
      .map((c) => ({ category: c, items: map.get(c)! }))
  }, [crm.integrations])

  return (
    <PageFrame
      title="Integrations"
      description="Connect Slack, email, HubSpot, Stripe, and automation tools. Test connections and sync data into your workspace."
      accent="brand"
      bodyClassName="space-y-6"
    >
      <div className="panel px-4 py-3 text-sm text-text-muted">
        <strong className="text-text">Tip:</strong> Outbound webhooks for custom events live under{' '}
        <a href="/settings" className="font-medium text-brand-600 hover:underline">
          Settings → Webhooks
        </a>
        . API keys for programmatic access are under Settings → API keys.
      </div>

      {grouped.map(({ category, items }) => (
        <section key={category}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            {categoryTitles[category] ?? category}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onUpdated={() => void crm.refreshWorkspace()}
              />
            ))}
          </div>
        </section>
      ))}

      {crm.integrations.length === 0 && (
        <p className="text-sm text-text-muted">Loading integrations…</p>
      )}
    </PageFrame>
  )
}
