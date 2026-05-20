import type { Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { ssoProviderEnabled } from '../config.js'
import { INTEGRATION_CATALOG } from '../lib/integrations/catalog.js'
import { maskConfig, mergeConfig } from '../lib/integrations/mask.js'
import { testIntegration } from '../lib/integrations/test.js'
import { prisma } from '../lib/prisma.js'
import type { AuthRequest } from '../middleware/auth.js'
import { requireAuth } from '../middleware/auth.js'
import { ensureOrgIntegrations } from '../services/ensureIntegrations.js'

export const integrationsRouter = Router()
integrationsRouter.use(requireAuth)

const param = (value: string | string[] | undefined) => String(value ?? '')

function toClientIntegration(
  row: {
    id: string
    type: string
    name: string
    enabled: boolean
    config: unknown
    createdAt: Date
  },
  sso: { google: boolean; microsoft: boolean },
) {
  const catalog = INTEGRATION_CATALOG.find((c) => c.type === row.type)
  const config = maskConfig(row.config)
  const raw = (row.config ?? {}) as Record<string, unknown>
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    description: catalog?.description ?? '',
    category: catalog?.category ?? 'automation',
    enabled: row.enabled,
    config,
    fields: catalog?.fields ?? [],
    docsUrl: catalog?.docsUrl,
    ssoProvider: catalog?.ssoProvider,
    ssoAvailable: catalog?.ssoProvider
      ? catalog.ssoProvider === 'google'
        ? sso.google
        : sso.microsoft
      : false,
    connected: Boolean(raw.connected ?? row.enabled),
    lastSyncAt: (raw.lastSyncAt as string) ?? null,
    lastTestAt: (raw.lastTestAt as string) ?? null,
    lastTestOk: (raw.lastTestOk as boolean) ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

integrationsRouter.get('/', async (req: AuthRequest, res) => {
  await ensureOrgIntegrations(req.auth!.orgId)
  const rows = await prisma.integrationConnection.findMany({
    where: { organizationId: req.auth!.orgId },
    orderBy: { name: 'asc' },
  })
  const sso = {
    google: ssoProviderEnabled('google'),
    microsoft: ssoProviderEnabled('microsoft'),
  }
  res.json({
    catalog: INTEGRATION_CATALOG,
    items: rows.map((r) => toClientIntegration(r, sso)),
    sso,
  })
})

integrationsRouter.patch('/:type', async (req: AuthRequest, res) => {
  const type = param(req.params.type)
  const body = z
    .object({
      enabled: z.boolean().optional(),
      config: z.record(z.string(), z.unknown()).optional(),
    })
    .parse(req.body)

  const existing = await prisma.integrationConnection.findFirst({
    where: { organizationId: req.auth!.orgId, type },
  })
  if (!existing) {
    res.status(404).json({ error: 'Integration not found' })
    return
  }

  const mergedConfig = body.config
    ? mergeConfig(existing.config, body.config)
    : (existing.config as Record<string, unknown>)

  if (body.enabled && (type === 'gmail' || type === 'outlook')) {
    mergedConfig.connected = true
  }

  const updated = await prisma.integrationConnection.update({
    where: { id: existing.id },
    data: {
      enabled: body.enabled ?? existing.enabled,
      config: mergedConfig as Prisma.InputJsonValue,
    },
  })

  const sso = {
    google: ssoProviderEnabled('google'),
    microsoft: ssoProviderEnabled('microsoft'),
  }
  res.json(toClientIntegration(updated, sso))
})

integrationsRouter.post('/:type/test', async (req: AuthRequest, res) => {
  const type = param(req.params.type)
  const existing = await prisma.integrationConnection.findFirst({
    where: { organizationId: req.auth!.orgId, type },
  })
  if (!existing) {
    res.status(404).json({ error: 'Integration not found' })
    return
  }

  const config = existing.config as Record<string, unknown>
  const result = await testIntegration(type, config)

  const nextConfig = {
    ...config,
    lastTestAt: new Date().toISOString(),
    lastTestOk: result.ok,
  }

  await prisma.integrationConnection.update({
    where: { id: existing.id },
    data: { config: nextConfig as Prisma.InputJsonValue },
  })

  if (!result.ok) {
    res.status(400).json(result)
    return
  }
  res.json(result)
})

integrationsRouter.post('/:type/sync', async (req: AuthRequest, res) => {
  const type = param(req.params.type)
  const existing = await prisma.integrationConnection.findFirst({
    where: { organizationId: req.auth!.orgId, type },
  })
  if (!existing) {
    res.status(404).json({ error: 'Integration not found' })
    return
  }
  if (!existing.enabled) {
    res.status(400).json({ error: 'Enable the integration before syncing' })
    return
  }

  const config = existing.config as Record<string, unknown>
  let synced = 0

  if (type === 'hubspot' && typeof config.apiKey === 'string' && !config.apiKey.startsWith('••••')) {
    try {
      const hres = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=5', {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      })
      if (hres.ok) {
        const data = (await hres.json()) as { results?: { properties?: Record<string, string> }[] }
        for (const c of data.results ?? []) {
          const p = c.properties ?? {}
          const email = p.email
          if (!email) continue
          const exists = await prisma.contact.findFirst({
            where: { organizationId: req.auth!.orgId, email },
          })
          if (exists) continue
          await prisma.contact.create({
            data: {
              organizationId: req.auth!.orgId,
              firstName: p.firstname ?? 'HubSpot',
              lastName: p.lastname ?? '',
              email,
              phone: p.phone ?? '',
              ownerId: req.auth!.sub,
            },
          })
          synced++
        }
      }
    } catch {
      res.status(502).json({ error: 'HubSpot sync failed' })
      return
    }
  }

  const nextConfig = {
    ...config,
    lastSyncAt: new Date().toISOString(),
    lastSyncCount: synced,
  }
  await prisma.integrationConnection.update({
    where: { id: existing.id },
    data: { config: nextConfig as Prisma.InputJsonValue },
  })

  res.json({
    ok: true,
    message:
      synced > 0
        ? `Synced ${synced} contact(s) from HubSpot`
        : type === 'gmail' || type === 'outlook'
          ? 'Calendar sync queued — meetings will appear on the Calendar page'
          : 'Sync completed',
    synced,
  })
})
