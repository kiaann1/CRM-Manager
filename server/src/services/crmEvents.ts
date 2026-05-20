import { dispatchIntegrationHooks } from '../lib/integrations/dispatch.js'
import { dispatchWebhooks } from './webhooks.js'

/** Fan-out a CRM event to Settings webhooks and Zapier/Make integration hooks (never throws). */
export async function emitCrmEvent(
  orgId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  const results = await Promise.allSettled([
    dispatchWebhooks(orgId, event, payload),
    dispatchIntegrationHooks(orgId, event, payload),
  ])
  for (const r of results) {
    if (r.status === 'rejected') {
      console.warn(`[crmEvents] ${event} delivery error:`, r.reason)
    }
  }
}
