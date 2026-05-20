import { z } from 'zod'

/** ISO 4217, validated with Intl. */
export const preferencesCurrencySchema = z
  .string()
  .length(3)
  .regex(/^[A-Za-z]{3}$/)
  .transform((s) => s.toUpperCase())
  .refine(
    (code) => {
      try {
        new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(0)
        return true
      } catch {
        return false
      }
    },
    { message: 'Invalid currency code' },
  )

export const preferencesLocaleSchema = z.string().min(2).max(40).trim().refine(
  (loc) => {
    try {
      void new Intl.Locale(loc)
      return true
    } catch {
      return false
    }
  },
  { message: 'Invalid locale' },
)

export const preferencesTimezoneSchema = z.string().min(2).max(80).trim().refine(
  (tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz }).format()
      return true
    } catch {
      return false
    }
  },
  { message: 'Invalid timezone' },
)
