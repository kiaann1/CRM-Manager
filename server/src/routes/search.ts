import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import type { AuthRequest } from '../middleware/auth.js'
import { requireAuth } from '../middleware/auth.js'

export const searchRouter = Router()
searchRouter.use(requireAuth)

searchRouter.get('/', async (req: AuthRequest, res) => {
  const q = String(req.query.q ?? '').trim()
  if (q.length < 2) {
    res.json({ contacts: [], companies: [], deals: [], leads: [], documents: [] })
    return
  }

  const orgId = req.auth!.orgId
  const contains = { contains: q, mode: 'insensitive' as const }

  const [contacts, companies, deals, leads, documents] = await Promise.all([
    prisma.contact.findMany({
      where: {
        organizationId: orgId,
        OR: [{ firstName: contains }, { lastName: contains }, { email: contains }, { title: contains }],
      },
      take: 8,
      select: { id: true, firstName: true, lastName: true, email: true, title: true },
    }),
    prisma.company.findMany({
      where: {
        organizationId: orgId,
        OR: [{ name: contains }, { industry: contains }, { website: contains }],
      },
      take: 8,
      select: { id: true, name: true, industry: true },
    }),
    prisma.deal.findMany({
      where: { organizationId: orgId, title: contains },
      take: 8,
      select: { id: true, title: true, stageKey: true, value: true },
    }),
    prisma.lead.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { firstName: contains },
          { lastName: contains },
          { email: contains },
          { company: contains },
        ],
      },
      take: 8,
      select: { id: true, firstName: true, lastName: true, email: true, company: true },
    }),
    prisma.document.findMany({
      where: { organizationId: orgId, title: contains },
      take: 8,
      select: { id: true, title: true },
    }),
  ])

  res.json({ contacts, companies, deals, leads, documents })
})
