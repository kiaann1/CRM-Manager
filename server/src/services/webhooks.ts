import { createHmac } from 'crypto'
import { prisma } from '../lib/prisma.js'

export async function dispatchWebhooks(
  orgId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  const hooks = await prisma.webhookEndpoint.findMany({
    where: { organizationId: orgId, enabled: true },
  })

  const matching = hooks.filter((h) => h.events.length === 0 || h.events.includes(event))

  await Promise.all(
    matching.map(async (hook) => {
      const body = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      })
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-CRM-Event': event,
      }
      if (hook.secret) {
        const sig = createHmac('sha256', hook.secret).update(body).digest('hex')
        headers['X-CRM-Signature'] = `sha256=${sig}`
      }

      let statusCode: number | null = null
      let success = false
      let error: string | null = null

      try {
        const res = await fetch(hook.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(10000),
        })
        statusCode = res.status
        success = res.ok
        if (!res.ok) error = await res.text().catch(() => res.statusText)
      } catch (e) {
        error = e instanceof Error ? e.message : 'Request failed'
      }

      await prisma.webhookDelivery.create({
        data: {
          webhookId: hook.id,
          event,
          payload: payload as object,
          statusCode,
          success,
          error,
        },
      })
    }),
  )
}
