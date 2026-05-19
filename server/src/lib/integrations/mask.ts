const SECRET_KEYS = new Set(['apiKey', 'webhookSecret', 'accessToken', 'refreshToken'])

export function maskConfig(config: unknown): Record<string, unknown> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {}
  }
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(config as Record<string, unknown>)) {
    if (typeof value === 'string' && SECRET_KEYS.has(key) && value.length > 4) {
      out[key] = `••••${value.slice(-4)}`
    } else {
      out[key] = value
    }
  }
  return out
}

export function mergeConfig(
  existing: unknown,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {}
  for (const [key, value] of Object.entries(patch)) {
    if (value === '' || value === undefined) {
      delete base[key]
    } else if (
      typeof value === 'string' &&
      SECRET_KEYS.has(key) &&
      value.startsWith('••••')
    ) {
      continue
    } else {
      base[key] = value
    }
  }
  return base
}
