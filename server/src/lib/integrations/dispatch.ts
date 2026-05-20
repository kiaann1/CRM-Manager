import { prisma } from '../prisma.js'

/** POST CRM events to enabled Zapier / Make catch-hook URLs (best-effort). */
export async function dispatchIntegrationHooks(
  organizationId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  const rows = await prisma.integrationConnection.findMany({
    where: {
      organizationId,
      enabled: true,
      type: { in: ['zapier', 'make'] },
    },
  })

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    source: 'crm-manager',
    data: payload,
  })

  await Promise.all(
    rows.map(async (row) => {
      const config = (row.config ?? {}) as Record<string, unknown>
      const url = (config.hookUrl ?? config.scenarioUrl) as string | undefined
      if (!url?.startsWith('http') || url.includes('••••')) return
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CRM-Event': event },
          body,
          signal: AbortSignal.timeout(10000),
        })
      } catch {
        /* ignore delivery errors */
      }
    }),
  )
}
