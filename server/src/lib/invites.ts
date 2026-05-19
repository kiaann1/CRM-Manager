import { randomBytes } from 'crypto'
import { config } from '../config.js'

const INVITE_TTL_DAYS = 7

export function generateInviteToken(): string {
  return randomBytes(24).toString('base64url')
}

export function inviteExpiresAt(): Date {
  const d = new Date()
  d.setDate(d.getDate() + INVITE_TTL_DAYS)
  return d
}

export function inviteUrl(token: string): string {
  const base = config.frontendUrl.replace(/\/$/, '')
  return `${base}/invite/${token}`
}

const MANAGER_ASSIGNABLE = new Set(['rep', 'guest', 'readonly'])

export function canAssignRole(inviterRole: string, targetRole: string): boolean {
  if (inviterRole === 'admin') return true
  if (inviterRole === 'manager') return MANAGER_ASSIGNABLE.has(targetRole)
  return false
}

export function canManageInvites(role: string): boolean {
  return role === 'admin' || role === 'manager'
}
