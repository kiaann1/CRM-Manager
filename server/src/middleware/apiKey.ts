import { createHash } from 'crypto'
import type { NextFunction, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import type { AccessTokenPayload } from '../lib/jwt.js'
import type { AuthRequest } from './auth.js'

function extractApiKey(req: AuthRequest): string | undefined {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer crm_')) return header.slice(7)
  const xKey = req.headers['x-api-key']
  if (typeof xKey === 'string' && xKey.startsWith('crm_')) return xKey
  return undefined
}

export async function authenticateApiKey(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<boolean> {
  const raw = extractApiKey(req)
  if (!raw) return false

  const keyHash = createHash('sha256').update(raw).digest('hex')
  const record = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      organization: {
        include: {
          memberships: {
            where: { role: 'admin' },
            take: 1,
            include: { user: true },
          },
        },
      },
    },
  })

  if (!record) {
    res.status(401).json({ error: 'Invalid API key' })
    return true
  }

  const admin = record.organization.memberships[0]
  if (!admin) {
    res.status(403).json({ error: 'Organization has no admin for API access' })
    return true
  }

  await prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  })

  const payload: AccessTokenPayload = {
    sub: admin.userId,
    email: admin.user.email,
    orgId: record.organizationId,
    role: 'admin',
  }
  req.auth = payload
  next()
  return true
}
