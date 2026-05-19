import { prisma } from '../prisma.js'

async function postWebhook(type: 'slack' | 'teams', url: string, text: string) {
  const body =
    type === 'slack'
      ? JSON.stringify({ text })
      : JSON.stringify({
          text,
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
        })
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

/** Post to enabled Slack / Teams webhooks (best-effort, never throws). */
export async function notifyIntegrationChannels(organizationId: string, text: string) {
  const rows = await prisma.integrationConnection.findMany({
    where: {
      organizationId,
      enabled: true,
      type: { in: ['slack', 'teams'] },
    },
  })

  for (const row of rows) {
    const config = (row.config ?? {}) as Record<string, unknown>
    const url = config.webhookUrl as string | undefined
    if (!url?.startsWith('http') || url.includes('••••')) continue
    const type = row.type as 'slack' | 'teams'
    try {
      await postWebhook(type, url, text)
    } catch {
      /* ignore delivery errors */
    }
  }
}
