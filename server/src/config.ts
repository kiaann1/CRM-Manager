import 'dotenv/config'

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: required('DATABASE_URL', 'postgresql://crm:crm@localhost:5432/crm_manager'),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  apiUrl: process.env.API_URL ?? 'http://localhost:3001',
  jwtSecret: required('JWT_SECRET', 'dev-jwt-secret-change-in-production-min-32-chars'),
  refreshSecret: required(
    'REFRESH_SECRET',
    'dev-refresh-secret-change-in-production-min-32-chars',
  ),
  accessTokenTtl: '15m',
  refreshTokenDays: 7,
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  },
  microsoft: {
    clientId: process.env.AZURE_AD_CLIENT_ID ?? '',
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
    tenantId: process.env.AZURE_AD_TENANT_ID ?? 'common',
  },
  oidc: {
    issuer: process.env.OIDC_ISSUER ?? '',
    clientId: process.env.OIDC_CLIENT_ID ?? '',
    clientSecret: process.env.OIDC_CLIENT_SECRET ?? '',
  },
}

export function ssoProviderEnabled(provider: 'google' | 'microsoft' | 'oidc'): boolean {
  if (provider === 'google') return Boolean(config.google.clientId && config.google.clientSecret)
  if (provider === 'microsoft')
    return Boolean(config.microsoft.clientId && config.microsoft.clientSecret)
  return Boolean(config.oidc.issuer && config.oidc.clientId && config.oidc.clientSecret)
}
