import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken, type AccessTokenPayload } from '../lib/jwt.js'
import { authenticateApiKey } from './apiKey.js'

export interface AuthRequest extends Request {
  auth?: AccessTokenPayload
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (await authenticateApiKey(req, res, next)) return

  try {
    const header = req.headers.authorization
    const cookieToken = req.cookies?.access_token as string | undefined
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined
    const token = bearer?.startsWith('crm_') ? undefined : bearer ?? cookieToken
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    req.auth = await verifyAccessToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    next()
  }
}
