import { z } from 'zod'

/** New passwords: length + uppercase + digit + special (non-alphanumeric). */
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[0-9]/, 'Include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Include at least one special character')

export function parseNewPassword(password: string): { ok: true; password: string } | { ok: false; message: string } {
  const r = passwordSchema.safeParse(password)
  if (r.success) return { ok: true, password: r.data }
  const first = r.error.issues[0]
  return { ok: false, message: first?.message ?? 'Invalid password' }
}
