import { INTEGRATION_CATALOG } from '../lib/integrations/catalog.js'
import { prisma } from '../lib/prisma.js'

export async function ensureOrgIntegrations(organizationId: string) {
  for (const entry of INTEGRATION_CATALOG) {
    await prisma.integrationConnection.upsert({
      where: {
        organizationId_type: { organizationId, type: entry.type },
      },
      create: {
        organizationId,
        type: entry.type,
        name: entry.name,
        enabled: false,
        config: {},
      },
      update: {},
    })
  }
}
