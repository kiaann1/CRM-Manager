import { createHash, randomBytes } from 'crypto'
import * as jose from 'jose'
import { config } from '../config.js'

const accessKey = new TextEncoder().encode(config.jwtSecret)
const refreshKey = new TextEncoder().encode(config.refreshSecret)

export interface AccessTokenPayload {
  sub: string
  email: string
  orgId: string
  role: string
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.accessTokenTtl)
    .sign(accessKey)
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jose.jwtVerify(token, accessKey)
  return payload as unknown as AccessTokenPayload
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url')
}

export async function createRefreshTokenRecord(userId: string) {
  const token = generateRefreshToken()
  const tokenHash = hashRefreshToken(token)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + config.refreshTokenDays)

  await prismaRefreshCreate(userId, tokenHash, expiresAt)
  return { token, expiresAt }
}

async function prismaRefreshCreate(userId: string, tokenHash: string, expiresAt: Date) {
  const { prisma } = await import('./prisma.js')
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  })
}

export async function rotateRefreshToken(oldToken: string): Promise<{
  token: string
  userId: string
} | null> {
  const { prisma } = await import('./prisma.js')
  const tokenHash = hashRefreshToken(oldToken)
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } })
  if (!existing || existing.expiresAt < new Date()) {
    if (existing) await prisma.refreshToken.delete({ where: { tokenHash } })
    return null
  }
  await prisma.refreshToken.delete({ where: { tokenHash } })
  const created = await createRefreshTokenRecord(existing.userId)
  return { token: created.token, userId: existing.userId }
}
