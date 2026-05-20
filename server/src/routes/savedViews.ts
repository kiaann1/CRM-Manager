import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import type { AuthRequest } from '../middleware/auth.js'

export const savedViewsRouter = Router()

const createSchema = z.object({
  entityType: z.enum(['contacts', 'deals', 'leads']),
  name: z.string().min(1).max(80),
  viewType: z.enum(['table', 'board']).optional(),
  filters: z.object({
    query: z.string().optional(),
    stage: z.string().optional(),
    minScore: z.number().int().min(0).max(100).optional(),
  }),
  shared: z.boolean().optional(),
})

savedViewsRouter.get('/', async (req: AuthRequest, res) => {
  const entityType = z
    .enum(['contacts', 'deals', 'leads'])
    .optional()
    .parse(req.query.entityType)
  const views = await prisma.savedView.findMany({
    where: {
      organizationId: req.auth!.orgId,
      ...(entityType ? { entityType } : {}),
      OR: [{ userId: req.auth!.sub }, { shared: true }],
    },
    orderBy: { createdAt: 'asc' },
  })
  res.json(
    views.map((v) => ({
      id: v.id,
      name: v.name,
      entityType: v.entityType,
      viewType: v.viewType,
      filters: v.filters as Record<string, string>,
      shared: v.shared,
    })),
  )
})

savedViewsRouter.post('/', async (req: AuthRequest, res) => {
  const body = createSchema.parse(req.body)
  const view = await prisma.savedView.create({
    data: {
      organizationId: req.auth!.orgId,
      userId: req.auth!.sub,
      entityType: body.entityType,
      name: body.name.trim(),
      viewType: body.viewType ?? 'table',
      filters: body.filters,
      shared: body.shared ?? false,
    },
  })
  res.status(201).json({
    id: view.id,
    name: view.name,
    entityType: view.entityType,
    viewType: view.viewType,
    filters: view.filters,
    shared: view.shared,
  })
})

savedViewsRouter.delete('/:id', async (req: AuthRequest, res) => {
  const id = String(req.params.id)
  const existing = await prisma.savedView.findFirst({
    where: { id, organizationId: req.auth!.orgId },
  })
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  if (existing.userId && existing.userId !== req.auth!.sub && req.auth!.role === 'rep') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  await prisma.savedView.delete({ where: { id } })
  res.status(204).end()
})
