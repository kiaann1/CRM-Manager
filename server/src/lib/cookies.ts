import type { Response } from 'express'
import { config } from '../config.js'

const common = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'lax' as const,
  path: '/',
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, { ...common, maxAge: 15 * 60 * 1000 })
  res.cookie('refresh_token', refreshToken, {
    ...common,
    maxAge: config.refreshTokenDays * 24 * 60 * 60 * 1000,
  })
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/' })
  res.clearCookie('refresh_token', { path: '/' })
}
