import * as client from 'openid-client'
import { config } from '../config.js'

export type SsoProvider = 'google' | 'microsoft' | 'oidc'

export async function getOidcConfig(provider: SsoProvider) {
  if (provider === 'google') {
    return client.discovery(
      new URL('https://accounts.google.com'),
      config.google.clientId,
      config.google.clientSecret,
    )
  }
  if (provider === 'microsoft') {
    const tenant = config.microsoft.tenantId || 'common'
    return client.discovery(
      new URL(`https://login.microsoftonline.com/${tenant}/v2.0`),
      config.microsoft.clientId,
      config.microsoft.clientSecret,
    )
  }
  return client.discovery(
    new URL(config.oidc.issuer),
    config.oidc.clientId,
    config.oidc.clientSecret,
  )
}

export function callbackUrl(provider: SsoProvider): string {
  return `${config.apiUrl}/api/auth/sso/${provider}/callback`
}
