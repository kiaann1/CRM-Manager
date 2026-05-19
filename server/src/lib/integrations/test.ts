import { catalogEntry } from './catalog.js'

export async function testIntegration(
  type: string,
  config: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  const entry = catalogEntry(type)
  if (!entry) {
    return { ok: false, message: 'Unknown integration' }
  }

  if (type === 'slack' || type === 'teams') {
    const url = config.webhookUrl as string | undefined
    if (!url?.startsWith('http')) {
      return { ok: false, message: 'Webhook URL is required' }
    }
    const text =
      type === 'slack'
        ? 'CRM Manager test message — your Slack integration is working.'
        : 'CRM Manager test — Teams webhook connected.'
    const body =
      type === 'slack'
        ? JSON.stringify({ text })
        : JSON.stringify({ text, '@type': 'MessageCard', '@context': 'http://schema.org/extensions' })
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText)
      return { ok: false, message: `Webhook returned ${res.status}: ${errText.slice(0, 120)}` }
    }
    return { ok: true, message: 'Test message sent to channel' }
  }

  if (type === 'gmail' || type === 'outlook') {
    if (!config.connected) {
      return { ok: false, message: 'Enable the integration and connect your account first' }
    }
    return { ok: true, message: 'Calendar & email sync configuration looks valid' }
  }

  if (type === 'hubspot') {
    const key = config.apiKey as string | undefined
    if (!key || key.startsWith('••••')) {
      return { ok: false, message: 'API key is required' }
    }
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (!res.ok) {
      return { ok: false, message: `HubSpot API error (${res.status})` }
    }
    return { ok: true, message: 'Connected to HubSpot API' }
  }

  if (type === 'zapier' || type === 'make') {
    const hook = (config.hookUrl ?? config.scenarioUrl) as string | undefined
    if (!hook?.startsWith('http')) {
      return { ok: true, message: 'Saved — trigger this integration using CRM outbound webhooks in Settings' }
    }
    const res = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'integration.test', source: 'crm-manager' }),
    })
    if (!res.ok) {
      return { ok: false, message: `Hook returned ${res.status}` }
    }
    return { ok: true, message: 'Test payload delivered' }
  }

  if (type === 'stripe') {
    if (!config.webhookSecret && !config.publishableKey) {
      return { ok: false, message: 'Add at least a webhook secret or publishable key' }
    }
    return { ok: true, message: 'Stripe keys saved — use Settings → Webhooks for payment events' }
  }

  return { ok: true, message: 'Configuration saved' }
}
