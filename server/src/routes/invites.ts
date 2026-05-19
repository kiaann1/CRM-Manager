import { Router } from 'express'
import { z } from 'zod'
import { writeAudit } from '../lib/audit.js'
import {
  canAssignRole,
  generateInviteToken,
  inviteExpiresAt,
  inviteUrl,
} from '../lib/invites.js'
import { prisma } from '../lib/prisma.js'
import type { AuthRequest } from '../middleware/auth.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const invitesRouter = Router()

const param = (value: string | string[] | undefined) => String(value ?? '')

const roleSchema = z.enum(['admin', 'manager', 'rep', 'guest', 'readonly'])

invitesRouter.use(requireAuth)
invitesRouter.use(requireRole('admin', 'manager'))

invitesRouter.get('/', async (req: AuthRequest, res) => {
  const now = new Date()
  const invites = await prisma.organizationInvite.findMany({
    where: {
      organizationId: req.auth!.orgId,
      acceptedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: { select: { name: true } },
    },
  })
  res.json(
    invites.map((i: (typeof invites)[number]) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
      invitedByName: i.invitedBy.name,
    })),
  )
})

invitesRouter.post('/', async (req: AuthRequest, res) => {
  const body = z
    .object({
      email: z.string().email(),
      role: roleSchema.default('rep'),
    })
    .parse(req.body)

  if (!canAssignRole(req.auth!.role, body.role)) {
    res.status(403).json({ error: 'You cannot assign that role' })
    return
  }

  const email = body.email.toLowerCase().trim()
  const orgId = req.auth!.orgId

  const existingMember = await prisma.membership.findFirst({
    where: {
      organizationId: orgId,
      user: { email },
    },
  })
  if (existingMember) {
    res.status(409).json({ error: 'This user is already a member of your workspace' })
    return
  }

  await prisma.organizationInvite.deleteMany({
    where: { organizationId: orgId, email, acceptedAt: null },
  })

  const token = generateInviteToken()
  const invite = await prisma.organizationInvite.create({
    data: {
      organizationId: orgId,
      email,
      role: body.role,
      token,
      invitedById: req.auth!.sub,
      expiresAt: inviteExpiresAt(),
    },
  })

  await writeAudit(orgId, req.auth!.sub, 'invite.created', 'invite', invite.id)

  res.status(201).json({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt.toISOString(),
    inviteUrl: inviteUrl(token),
  })
})

invitesRouter.delete('/:id', async (req: AuthRequest, res) => {
  const invite = await prisma.organizationInvite.findFirst({
    where: { id: param(req.params.id), organizationId: req.auth!.orgId, acceptedAt: null },
  })
  if (!invite) {
    res.status(404).json({ error: 'Invite not found' })
    return
  }
  await prisma.organizationInvite.delete({ where: { id: invite.id } })
  await writeAudit(req.auth!.orgId, req.auth!.sub, 'invite.revoked', 'invite', invite.id)
  res.status(204).end()
})
