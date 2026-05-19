import { Router } from 'express'
import bcrypt from 'bcryptjs'
import * as oidc from 'openid-client'
import { z } from 'zod'
import { writeAudit } from '../lib/audit.js'
import { config, ssoProviderEnabled } from '../config.js'
import { clearAuthCookies, setAuthCookies } from '../lib/cookies.js'
import {
  createRefreshTokenRecord,
  hashRefreshToken,
  rotateRefreshToken,
  signAccessToken,
} from '../lib/jwt.js'
import { prisma } from '../lib/prisma.js'
import { callbackUrl, getOidcConfig, type SsoProvider } from '../lib/sso.js'
import type { AuthRequest } from '../middleware/auth.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  organizationName: z.string().min(1),
})

async function issueSession(
  userId: string,
  email: string,
  orgId: string,
  role: string,
  res: import('express').Response,
) {
  const accessToken = await signAccessToken({ sub: userId, email, orgId, role })
  const { token: refreshToken } = await createRefreshTokenRecord(userId)
  setAuthCookies(res, accessToken, refreshToken)
  return { accessToken, refreshToken }
}

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  const { email, password, name, organizationName } = parsed.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }

  const slug = organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

  const passwordHash = await bcrypt.hash(password, 12)
  const org = await prisma.organization.create({
    data: {
      name: organizationName,
      slug: `${slug}-${Date.now().toString(36)}`,
      teams: { create: { name: 'Sales', workspaceName: 'Main workspace' } },
      pipelines: {
        create: {
          name: 'Default sales pipeline',
          stages: {
            create: [
              { key: 'lead', label: 'Lead', order: 0, color: 'bg-slate-100 text-slate-700', probability: 10 },
              { key: 'qualified', label: 'Qualified', order: 1, color: 'bg-sky-100 text-sky-700', probability: 25 },
              { key: 'proposal', label: 'Proposal', order: 2, color: 'bg-violet-100 text-violet-700', probability: 50 },
              { key: 'negotiation', label: 'Negotiation', order: 3, color: 'bg-amber-100 text-amber-800', probability: 75 },
              { key: 'won', label: 'Won', order: 4, color: 'bg-emerald-100 text-emerald-700', probability: 100 },
              { key: 'lost', label: 'Lost', order: 5, color: 'bg-rose-100 text-rose-700', probability: 0 },
            ],
          },
        },
      },
    },
    include: { teams: true },
  })

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      preferences: { create: {} },
      memberships: {
        create: {
          organizationId: org.id,
          role: 'admin',
          teamId: org.teams[0]?.id,
        },
      },
    },
  })

  await issueSession(user.id, user.email, org.id, 'admin', res)
  res.status(201).json({ user: { id: user.id, email, name }, organizationId: org.id })
})

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid credentials' })
    return
  }
  const email = parsed.data.email.trim().toLowerCase()
  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  })
  if (!user?.passwordHash) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!ok) {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }
  const membership = user.memberships[0]
  if (!membership) {
    res.status(403).json({ error: 'No organization membership' })
    return
  }
  await issueSession(user.id, user.email, membership.organizationId, membership.role, res)
  res.json({ user: { id: user.id, email: user.email, name: user.name } })
})

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token as string | undefined
  if (!token) {
    res.status(401).json({ error: 'No refresh token' })
    return
  }
  const rotated = await rotateRefreshToken(token)
  if (!rotated) {
    clearAuthCookies(res)
    res.status(401).json({ error: 'Refresh expired' })
    return
  }
  const user = await prisma.user.findUnique({
    where: { id: rotated.userId },
    include: { memberships: true },
  })
  if (!user?.memberships[0]) {
    res.status(401).json({ error: 'User not found' })
    return
  }
  const m = user.memberships[0]
  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    orgId: m.organizationId,
    role: m.role,
  })
  setAuthCookies(res, accessToken, rotated.token as string)
  res.json({ ok: true })
})

authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.refresh_token as string | undefined
  if (token) {
    await prisma.refreshToken.deleteMany({
      where: { tokenHash: hashRefreshToken(token) },
    })
  }
  clearAuthCookies(res)
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.sub },
    include: { memberships: { where: { organizationId: req.auth!.orgId } } },
  })
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    organizationId: req.auth!.orgId,
    role: req.auth!.role,
  })
})

authRouter.get('/invite/:token', async (req, res) => {
  const token = String(req.params.token ?? '')
  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  })
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    res.status(404).json({ error: 'Invite not found or expired' })
    return
  }
  const existing = await prisma.user.findUnique({ where: { email: invite.email } })
  res.json({
    organizationName: invite.organization.name,
    email: invite.email,
    role: invite.role,
    existingUser: Boolean(existing),
    expiresAt: invite.expiresAt.toISOString(),
  })
})

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
})

authRouter.post('/accept-invite', async (req, res) => {
  const parsed = acceptInviteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  const { token, name, password } = parsed.data

  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
    include: { organization: { include: { teams: { take: 1, orderBy: { name: 'asc' } } } } },
  })
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    res.status(400).json({ error: 'Invite not found or expired' })
    return
  }

  const existingMember = await prisma.membership.findFirst({
    where: { organizationId: invite.organizationId, user: { email: invite.email } },
  })
  if (existingMember) {
    res.status(409).json({ error: 'You are already a member of this workspace' })
    return
  }

  let user = await prisma.user.findUnique({ where: { email: invite.email } })

  if (!user) {
    if (!name?.trim() || !password) {
      res.status(400).json({ error: 'Name and password are required for new accounts' })
      return
    }
    const passwordHash = await bcrypt.hash(password, 12)
    user = await prisma.user.create({
      data: {
        email: invite.email,
        name: name.trim(),
        passwordHash,
        preferences: { create: {} },
      },
    })
  } else {
    if (!user.passwordHash) {
      res.status(400).json({
        error: 'Sign in with SSO using this email, then open the invite link again',
      })
      return
    }
    if (!password) {
      res.status(400).json({ error: 'Password is required to accept this invite' })
      return
    }
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      res.status(401).json({ error: 'Invalid password' })
      return
    }
    if (name?.trim() && name.trim() !== user.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim() },
      })
    }
  }

  const teamId = invite.organization.teams[0]?.id ?? null
  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: invite.organizationId,
      role: invite.role,
      teamId,
    },
  })

  await prisma.organizationInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  })

  await writeAudit(invite.organizationId, user.id, 'invite.accepted', 'invite', invite.id)

  await issueSession(user.id, user.email, invite.organizationId, invite.role, res)
  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    organizationId: invite.organizationId,
  })
})

authRouter.get('/sso/providers', (_req, res) => {
  res.json({
    google: ssoProviderEnabled('google'),
    microsoft: ssoProviderEnabled('microsoft'),
    oidc: ssoProviderEnabled('oidc'),
  })
})

authRouter.get('/sso/:provider', async (req, res) => {
  const provider = req.params.provider as SsoProvider
  if (!ssoProviderEnabled(provider)) {
    res.status(400).json({ error: `${provider} SSO not configured` })
    return
  }
  const oidcConfig = await getOidcConfig(provider)
  const state = oidc.randomState()
  const nonce = oidc.randomNonce()
  res.cookie('sso_state', state, { httpOnly: true, maxAge: 600_000, sameSite: 'lax' })
  res.cookie('sso_nonce', nonce, { httpOnly: true, maxAge: 600_000, sameSite: 'lax' })
  const url = oidc.buildAuthorizationUrl(oidcConfig, {
    redirect_uri: callbackUrl(provider),
    scope: 'openid email profile',
    state,
    nonce,
  })
  res.redirect(url.href)
})

authRouter.get('/sso/:provider/callback', async (req, res) => {
  const provider = req.params.provider as SsoProvider
  const stateCookie = req.cookies?.sso_state as string | undefined
  const nonceCookie = req.cookies?.sso_nonce as string | undefined
  if (!stateCookie || stateCookie !== req.query.state) {
    res.redirect(`${config.frontendUrl}/login?error=state_mismatch`)
    return
  }

  try {
    const oidcConfig = await getOidcConfig(provider)
    const tokens = await oidc.authorizationCodeGrant(oidcConfig, new URL(req.url, config.apiUrl), {
      expectedState: stateCookie,
      expectedNonce: nonceCookie,
    })
    const claims = tokens.claims()
    if (!claims?.email) {
      res.redirect(`${config.frontendUrl}/login?error=no_email`)
      return
    }

    const email = String(claims.email)
    const sub = String(claims.sub)
    const name = String(claims.name ?? email.split('@')[0])

    let user = await prisma.user.findFirst({
      where: { oauthProvider: provider, oauthSubject: sub },
      include: { memberships: true },
    })

    if (!user) {
      const byEmail = await prisma.user.findUnique({
        where: { email },
        include: { memberships: true },
      })
      if (byEmail) {
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: { oauthProvider: provider, oauthSubject: sub, avatar: claims.picture as string | undefined },
          include: { memberships: true },
        })
      } else {
        const org = await prisma.organization.create({
          data: {
            name: `${name}'s Organization`,
            slug: `org-${Date.now().toString(36)}`,
            teams: { create: { name: 'Sales', workspaceName: 'Main workspace' } },
            pipelines: {
              create: {
                name: 'Default sales pipeline',
                stages: {
                  create: [
                    { key: 'lead', label: 'Lead', order: 0, color: 'bg-slate-100', probability: 10 },
                    { key: 'qualified', label: 'Qualified', order: 1, color: 'bg-sky-100', probability: 25 },
                    { key: 'proposal', label: 'Proposal', order: 2, color: 'bg-violet-100', probability: 50 },
                    { key: 'negotiation', label: 'Negotiation', order: 3, color: 'bg-amber-100', probability: 75 },
                    { key: 'won', label: 'Won', order: 4, color: 'bg-emerald-100', probability: 100 },
                    { key: 'lost', label: 'Lost', order: 5, color: 'bg-rose-100', probability: 0 },
                  ],
                },
              },
            },
          },
          include: { teams: true },
        })
        user = await prisma.user.create({
          data: {
            email,
            name,
            oauthProvider: provider,
            oauthSubject: sub,
            avatar: typeof claims.picture === 'string' ? claims.picture : undefined,
            preferences: { create: {} },
            memberships: {
              create: {
                organizationId: org.id,
                role: 'admin',
                teamId: org.teams[0]?.id,
              },
            },
          },
          include: { memberships: true },
        })
      }
    }

    const membership = user!.memberships[0]
    if (!membership) {
      res.redirect(`${config.frontendUrl}/login?error=no_org`)
      return
    }

    await issueSession(
      user!.id,
      user!.email,
      membership.organizationId,
      membership.role,
      res,
    )
    res.redirect(`${config.frontendUrl}/`)
  } catch (e) {
    console.error('SSO callback error', e)
    res.redirect(`${config.frontendUrl}/login?error=sso_failed`)
  }
})
