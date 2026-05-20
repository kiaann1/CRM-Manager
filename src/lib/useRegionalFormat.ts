import { useMemo } from 'react'
import { useCrm } from '../context/CrmContext'
import { formatCurrency, formatDate } from './format'

/**
 * Date/currency formatters using Settings → Profile regional preferences.
 */
export function useRegionalFormat() {
  const { preferences } = useCrm()
  const regional = useMemo(
    () => ({
      currency: preferences.currency,
      locale: preferences.locale,
      timezone: preferences.timezone,
    }),
    [preferences.currency, preferences.locale, preferences.timezone],
  )
  return useMemo(
    () => ({
      formatCurrency: (value: number) => formatCurrency(value, regional),
      formatDate: (date: string) => formatDate(date, regional),
    }),
    [regional],
  )
}
