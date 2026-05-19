import { prisma } from './prisma.js'

export async function writeAudit(
  orgId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
) {
  await prisma.auditLog.create({
    data: { organizationId: orgId, userId, action, entityType, entityId },
  })
}
