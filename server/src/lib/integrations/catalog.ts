export type IntegrationType =
  | 'slack'
  | 'teams'
  | 'gmail'
  | 'outlook'
  | 'zapier'
  | 'make'
  | 'hubspot'
  | 'stripe'

export type IntegrationCategory = 'communication' | 'calendar' | 'automation' | 'crm' | 'billing'

export interface IntegrationFieldDef {
  key: string
  label: string
  type: 'text' | 'password' | 'url'
  placeholder?: string
  required?: boolean
}

export interface IntegrationCatalogEntry {
  type: IntegrationType
  name: string
  description: string
  category: IntegrationCategory
  fields: IntegrationFieldDef[]
  docsUrl?: string
  ssoProvider?: 'google' | 'microsoft'
}

export const INTEGRATION_CATALOG: IntegrationCatalogEntry[] = [
  {
    type: 'slack',
    name: 'Slack',
    description: 'Post deal updates, stage changes, and @mentions to a channel via incoming webhook.',
    category: 'communication',
    fields: [
      {
        key: 'webhookUrl',
        label: 'Incoming webhook URL',
        type: 'url',
        placeholder: 'https://hooks.slack.com/services/...',
        required: true,
      },
      { key: 'channel', label: 'Channel label (optional)', type: 'text', placeholder: '#sales' },
    ],
    docsUrl: 'https://api.slack.com/messaging/webhooks',
  },
  {
    type: 'teams',
    name: 'Microsoft Teams',
    description: 'Notify your team channel when deals move or tasks are overdue.',
    category: 'communication',
    fields: [
      {
        key: 'webhookUrl',
        label: 'Teams incoming webhook URL',
        type: 'url',
        placeholder: 'https://outlook.office.com/webhook/...',
        required: true,
      },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors',
  },
  {
    type: 'gmail',
    name: 'Gmail',
    description: 'Log sent email to contact timelines and sync calendar meetings (Google Workspace).',
    category: 'calendar',
    fields: [],
    ssoProvider: 'google',
    docsUrl: 'https://developers.google.com/gmail/api',
  },
  {
    type: 'outlook',
    name: 'Outlook / Microsoft 365',
    description: 'Sync Outlook calendar and log email activity on CRM records.',
    category: 'calendar',
    fields: [],
    ssoProvider: 'microsoft',
    docsUrl: 'https://learn.microsoft.com/en-us/graph/overview',
  },
  {
    type: 'zapier',
    name: 'Zapier',
    description: 'Trigger Zaps when contacts, deals, or leads are created or updated.',
    category: 'automation',
    fields: [
      {
        key: 'hookUrl',
        label: 'Catch Hook URL (from Zapier)',
        type: 'url',
        placeholder: 'https://hooks.zapier.com/hooks/catch/...',
      },
    ],
    docsUrl: 'https://zapier.com/apps/crm/integrations',
  },
  {
    type: 'make',
    name: 'Make (Integromat)',
    description: 'Build scenarios that react to CRM webhooks and API events.',
    category: 'automation',
    fields: [
      {
        key: 'scenarioUrl',
        label: 'Webhook module URL',
        type: 'url',
        placeholder: 'https://hook.eu1.make.com/...',
      },
    ],
    docsUrl: 'https://www.make.com/en/integrations',
  },
  {
    type: 'hubspot',
    name: 'HubSpot',
    description: 'One-way sync of contacts and companies (import via API key).',
    category: 'crm',
    fields: [
      {
        key: 'apiKey',
        label: 'Private app access token',
        type: 'password',
        placeholder: 'pat-...',
        required: true,
      },
      { key: 'portalId', label: 'Hub ID (optional)', type: 'text', placeholder: '12345678' },
    ],
    docsUrl: 'https://developers.hubspot.com/docs/api/private-apps',
  },
  {
    type: 'stripe',
    name: 'Stripe',
    description: 'Match won deals to Stripe payments and subscription revenue.',
    category: 'billing',
    fields: [
      {
        key: 'webhookSecret',
        label: 'Webhook signing secret',
        type: 'password',
        placeholder: 'whsec_...',
      },
      {
        key: 'publishableKey',
        label: 'Publishable key (optional)',
        type: 'text',
        placeholder: 'pk_live_...',
      },
    ],
    docsUrl: 'https://stripe.com/docs/webhooks',
  },
]

export function catalogEntry(type: string): IntegrationCatalogEntry | undefined {
  return INTEGRATION_CATALOG.find((c) => c.type === type)
}
