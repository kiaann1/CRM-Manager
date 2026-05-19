import { Copy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { useCrm } from '../context/CrmContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/api/client'
import { formatDate } from '../lib/format'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { PipelineStageRow } from '../components/settings/PipelineStageRow'

const tabs = [
  'Profile',
  'Workspace',
  'Notifications',
  'Integrations',
  'Webhooks',
  'Pipeline',
  'Fields',
  'Team',
  'Security',
  'Audit',
  'Data',
] as const

const WEBHOOK_EVENTS = [
  'contact.created',
  'deal.created',
  'deal.stage_changed',
  'deal.updated',
  'deal.deleted',
  'webhook.test',
]

export function SettingsPage() {
  const crm = useCrm()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const initialTab =
    tabFromUrl && tabs.includes(tabFromUrl as (typeof tabs)[number])
      ? (tabFromUrl as (typeof tabs)[number])
      : 'Profile'
  const [tab, setTab] = useState<(typeof tabs)[number]>(initialTab)

  useEffect(() => {
    if (tabFromUrl && tabs.includes(tabFromUrl as (typeof tabs)[number])) {
      setTab(tabFromUrl as (typeof tabs)[number])
    }
  }, [tabFromUrl])
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [apiKeyName, setApiKeyName] = useState('')
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<
    { id: string; name: string; prefix: string; lastUsedAt: string | null }[]
  >([])
  const [sso, setSso] = useState({ google: false, microsoft: false, oidc: false })
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['deal.stage_changed'])
  const [webhooks, setWebhooks] = useState(crm.webhooks)
  const [integrations, setIntegrations] = useState(crm.integrations)
  const [invites, setInvites] = useState<
    { id: string; email: string; role: string; expiresAt: string; invitedByName: string }[]
  >([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('rep')
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState('')

  const canManageTeam =
    crm.currentUser?.role === 'admin' || crm.currentUser?.role === 'manager'

  const inviteRoleOptions = useMemo(() => {
    const roles =
      crm.currentUser?.role === 'admin'
        ? (['admin', 'manager', 'rep', 'guest', 'readonly'] as const)
        : (['rep', 'guest', 'readonly'] as const)
    return roles.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))
  }, [crm.currentUser?.role])

  useEffect(() => {
    setWebhooks(crm.webhooks)
    setIntegrations(crm.integrations)
  }, [crm.webhooks, crm.integrations])

  useEffect(() => {
    if (tab !== 'Security') return
    api.listApiKeys().then(setApiKeys).catch(() => undefined)
    api.ssoProviders().then(setSso).catch(() => undefined)
  }, [tab])

  useEffect(() => {
    if (tab !== 'Webhooks') return
    api.listWebhooks().then(setWebhooks).catch(() => undefined)
  }, [tab])

  useEffect(() => {
    if (tab !== 'Team' || !canManageTeam) return
    api.listInvites().then(setInvites).catch(() => undefined)
  }, [tab, canManageTeam])

  const workspaceName = crm.workspaces[0]?.name ?? 'Workspace'
  const toggleWebhookEvent = (event: string) => {
    setWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    )
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Profile, workspace, integrations, security, and data controls"
      />
      <section className="page-shell flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 flex-wrap gap-1 lg:w-44 lg:flex-col">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`settings-tab ${tab === t ? 'settings-tab-active' : ''}`}
            >
              {t}
            </button>
          ))}
        </nav>
        <article className="min-w-0 flex-1 panel panel-pad-lg">
          {tab === 'Profile' && (
            <div className="space-y-4">
              <p className="text-sm">
                Signed in as <strong>{crm.currentUser?.name}</strong> ({crm.currentUser?.email})
              </p>
              <p className="text-sm text-text-muted">
                Role: <span className="capitalize">{crm.currentUser?.role}</span>
              </p>
              <Select
                label="Theme"
                className="max-w-xs"
                value={crm.preferences.theme}
                onChange={(e) =>
                  crm.setPreferences({
                    theme: e.target.value as 'light' | 'dark' | 'system',
                  })
                }
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ]}
              />
            </div>
          )}

          {tab === 'Workspace' && (
            <div className="space-y-4">
              <section>
                <h3 className="text-sm font-semibold">Organization</h3>
                <p className="mt-1 text-sm text-text-muted">{workspaceName}</p>
                <p className="text-xs text-text-muted">
                  {crm.users.length} member{crm.users.length === 1 ? '' : 's'} · {crm.teams.length}{' '}
                  team{crm.teams.length === 1 ? '' : 's'} · {crm.territories.length} territor
                  {crm.territories.length === 1 ? 'y' : 'ies'}
                </p>
              </section>
              <section>
                <h3 className="text-sm font-semibold">Workspaces</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {crm.workspaces.map((w) => (
                    <li key={w.id} className="rounded-lg border border-border px-3 py-2">
                      {w.name}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="text-sm font-semibold">Tags</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {crm.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.name}
                    </span>
                  ))}
                  {crm.tags.length === 0 && (
                    <p className="text-sm text-text-muted">No tags configured</p>
                  )}
                </div>
                <div className="mt-3 flex max-w-sm gap-2">
                  <Input
                    label="New tag"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <Button
                    className="self-end"
                    onClick={() => {
                      if (!newTagName.trim()) return
                      crm.createTag(newTagName.trim())
                      setNewTagName('')
                      toast.success('Tag created')
                    }}
                  >
                    Add tag
                  </Button>
                </div>
              </section>
            </div>
          )}

          {tab === 'Notifications' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={crm.preferences.emailDigest}
                  onChange={(e) => crm.setPreferences({ emailDigest: e.target.checked })}
                />
                Weekly email digest
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={crm.preferences.pushEnabled}
                  onChange={(e) => crm.setPreferences({ pushEnabled: e.target.checked })}
                />
                Browser push notifications
              </label>
              <p className="text-xs text-text-muted">
                In-app notifications: {crm.notifications.filter((n) => !n.read).length} unread of{' '}
                {crm.notifications.length} total.
              </p>
            </div>
          )}

          {tab === 'Integrations' && (
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                Configure Slack, HubSpot, Stripe, Gmail, and more on the integrations hub. OAuth for
                Google/Microsoft is set in <code>server/.env</code>.
              </p>
              <a
                href="/integrations"
                className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Open integrations hub →
              </a>
              <p className="text-xs text-text-muted">
                {integrations.filter((i) => i.enabled).length} of {integrations.length} enabled
              </p>
            </div>
          )}

          {tab === 'Webhooks' && (
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-semibold">Endpoints</h3>
                <ul className="mt-2 space-y-2">
                  {webhooks.map((w) => (
                    <li
                      key={w.id}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <p className="font-mono text-xs break-all">{w.url}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {w.enabled ? 'Active' : 'Disabled'} · {w.events.join(', ')}
                      </p>
                      <Button
                        variant="ghost"
                        className="mt-2 px-2 py-1 text-xs"
                        onClick={async () => {
                          try {
                            await api.testWebhook(w.id)
                            toast.success('Test payload sent')
                          } catch {
                            toast.error('Webhook test failed')
                          }
                        }}
                      >
                        Send test
                      </Button>
                    </li>
                  ))}
                  {webhooks.length === 0 && (
                    <p className="text-sm text-text-muted">No webhooks yet.</p>
                  )}
                </ul>
              </section>
              <section className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold">Add endpoint</h3>
                <Input
                  label="URL"
                  className="mt-2 max-w-lg"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://example.com/hooks/crm"
                />
                <p className="mt-3 text-xs font-medium text-text-muted">Events</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEBHOOK_EVENTS.map((ev) => (
                    <label
                      key={ev}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={webhookEvents.includes(ev)}
                        onChange={() => toggleWebhookEvent(ev)}
                      />
                      {ev}
                    </label>
                  ))}
                </div>
                <Button
                  className="mt-4"
                  onClick={async () => {
                    if (!webhookUrl.trim() || webhookEvents.length === 0) {
                      toast.error('URL and at least one event required')
                      return
                    }
                    try {
                      await api.createWebhook({
                        url: webhookUrl.trim(),
                        events: webhookEvents,
                      })
                      setWebhookUrl('')
                      const list = await api.listWebhooks()
                      setWebhooks(list)
                      crm.patch((prev) => ({ ...prev, webhooks: list }))
                      toast.success('Webhook created')
                    } catch {
                      toast.error('Failed to create webhook')
                    }
                  }}
                >
                  Create webhook
                </Button>
              </section>
            </div>
          )}

          {tab === 'Pipeline' && (
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                Edit win probability for forecasting. Stage keys are fixed; labels and probabilities
                update live on the deals board.
              </p>
              <ul className="space-y-3">
                {crm.pipelineStages
                  .sort((a, b) => a.order - b.order)
                  .map((s) => (
                    <PipelineStageRow key={s.id} stage={s} onSave={crm.updatePipelineStage} />
                  ))}
              </ul>
            </div>
          )}

          {tab === 'Fields' && (
            <>
              <ul className="mb-4 space-y-1">
                {crm.customFieldDefs.map((f) => (
                  <li key={f.id} className="text-sm">
                    {f.label} ({f.type}) on {f.entityType}
                  </li>
                ))}
              </ul>
              <section className="flex max-w-md gap-2">
                <Input
                  label="New field label"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                />
                <Button
                  className="self-end"
                  onClick={() => {
                    if (newFieldLabel) {
                      crm.addCustomFieldDef({
                        entityType: 'deal',
                        label: newFieldLabel,
                        type: 'text',
                        options: [],
                      })
                      setNewFieldLabel('')
                      toast.success('Custom field added')
                    }
                  }}
                >
                  Add
                </Button>
              </section>
            </>
          )}

          {tab === 'Team' && (
            <div className="space-y-6">
              {canManageTeam && (
                <section className="rounded-lg border border-border p-4">
                  <h3 className="text-sm font-semibold">Invite people</h3>
                  <p className="mt-1 text-sm text-text-muted">
                    Send a link to join this workspace. Invites expire after 7 days.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <Input
                      label="Email"
                      type="email"
                      className="flex-1"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                    />
                    <Select
                      label="Role"
                      className="w-full sm:w-40"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      options={inviteRoleOptions}
                    />
                    <Button
                      className="sm:mb-0.5"
                      onClick={async () => {
                        if (!inviteEmail.trim()) {
                          toast.error('Enter an email address')
                          return
                        }
                        try {
                          const res = await api.createInvite({
                            email: inviteEmail.trim(),
                            role: inviteRole,
                          })
                          setLastInviteUrl(res.inviteUrl)
                          setInviteEmail('')
                          const list = await api.listInvites()
                          setInvites(list)
                          toast.success(`Invite sent to ${res.email}`)
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Invite failed')
                        }
                      }}
                    >
                      Send invite
                    </Button>
                  </div>
                  {lastInviteUrl && (
                    <div className="mt-4 rounded-lg bg-brand-50 p-3 text-sm dark:bg-brand-950">
                      <p className="font-medium text-brand-900 dark:text-brand-100">
                        Share this link with your teammate:
                      </p>
                      <div className="mt-2 flex gap-2">
                        <code className="flex-1 break-all text-xs">{lastInviteUrl}</code>
                        <Button
                          variant="secondary"
                          className="shrink-0 px-2 py-1"
                          onClick={() => {
                            void navigator.clipboard.writeText(lastInviteUrl)
                            toast.success('Link copied')
                          }}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                  {invites.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-text-muted">Pending invites</p>
                      <ul className="mt-2 space-y-2">
                        {invites.map((inv) => (
                          <li
                            key={inv.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                          >
                            <span>
                              <strong>{inv.email}</strong>
                              <span className="ml-2 capitalize text-text-muted">{inv.role}</span>
                              <span className="block text-xs text-text-muted">
                                Expires {formatDate(inv.expiresAt)} · by {inv.invitedByName}
                              </span>
                            </span>
                            <Button
                              variant="ghost"
                              className="px-2 py-1 text-xs"
                              onClick={async () => {
                                try {
                                  await api.revokeInvite(inv.id)
                                  setInvites((list) => list.filter((i) => i.id !== inv.id))
                                  toast.success('Invite revoked')
                                } catch {
                                  toast.error('Could not revoke invite')
                                }
                              }}
                            >
                              Revoke
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}
              {!canManageTeam && (
                <p className="text-sm text-text-muted">
                  Only admins and managers can invite new members.
                </p>
              )}
              <section>
                <h3 className="text-sm font-semibold">Members</h3>
                <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                  {crm.users.map((u) => (
                    <li key={u.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>
                        <strong>{u.name}</strong>
                        <span className="ml-2 text-text-muted">{u.email}</span>
                      </span>
                      <span className="capitalize text-xs text-text-muted">{u.role}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="text-sm font-semibold">Teams</h3>
                {crm.teams.map((t) => (
                  <p key={t.id} className="mt-1 text-sm">
                    {t.name}
                  </p>
                ))}
              </section>
              <section>
                <h3 className="text-sm font-semibold">Territories</h3>
                {crm.territories.map((t) => (
                  <p key={t.id} className="mt-1 text-sm">
                    {t.name}
                  </p>
                ))}
              </section>
            </div>
          )}

          {tab === 'Security' && (
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-text">Single sign-on</h3>
                <p className="mt-1 text-sm text-text-muted">
                  Configure Google, Microsoft Entra ID, or generic OIDC in <code>server/.env</code>.
                  Callback URLs: <code>/api/auth/sso/google</code>, <code>microsoft</code>,{' '}
                  <code>oidc</code>.
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>Google: {sso.google ? 'enabled' : 'not configured'}</li>
                  <li>Microsoft: {sso.microsoft ? 'enabled' : 'not configured'}</li>
                  <li>OIDC (Okta, Auth0, Keycloak): {sso.oidc ? 'enabled' : 'not configured'}</li>
                </ul>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-text">API keys</h3>
                <p className="mt-1 text-sm text-text-muted">
                  Use <code>Authorization: Bearer crm_…</code> or <code>X-API-Key</code> for
                  programmatic access to <code>/api/v1/*</code>.
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {apiKeys.map((k) => (
                    <li key={k.id}>
                      {k.name} — <code>{k.prefix}…</code>
                      {k.lastUsedAt && (
                        <span className="text-text-muted">
                          {' '}
                          (last used {new Date(k.lastUsedAt).toLocaleDateString()})
                        </span>
                      )}
                    </li>
                  ))}
                  {apiKeys.length === 0 && <li className="text-text-muted">No API keys yet</li>}
                </ul>
                <div className="mt-3 flex max-w-md gap-2">
                  <Input
                    label="Key name"
                    value={apiKeyName}
                    onChange={(e) => setApiKeyName(e.target.value)}
                  />
                  <Button
                    className="self-end"
                    onClick={async () => {
                      if (!apiKeyName.trim()) return
                      const res = await api.createApiKey(apiKeyName.trim())
                      setNewApiKey(res.key)
                      setApiKeyName('')
                      const list = await api.listApiKeys()
                      setApiKeys(list)
                      toast.success('API key created')
                    }}
                  >
                    Create key
                  </Button>
                </div>
                {newApiKey && (
                  <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                    Copy now — this key is shown once:{' '}
                    <code className="break-all">{newApiKey}</code>
                  </p>
                )}
              </section>
              <p className="text-sm text-text-muted">
                Role-based access — your role: {crm.currentUser?.role}
              </p>
            </div>
          )}

          {tab === 'Audit' && (
            <div className="space-y-2">
              <p className="text-sm text-text-muted">
                Recent activity in this workspace ({crm.auditLog.length} entries).
              </p>
              <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-surface-muted text-xs text-text-muted">
                    <tr>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Entity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...crm.auditLog]
                      .sort((a, b) => b.at.localeCompare(a.at))
                      .slice(0, 100)
                      .map((e) => {
                        const user = crm.getUser(e.userId)
                        return (
                          <tr key={e.id} className="border-t border-border">
                            <td className="px-3 py-2 text-xs text-text-muted whitespace-nowrap">
                              {formatDate(e.at)}
                            </td>
                            <td className="px-3 py-2">{e.action}</td>
                            <td className="px-3 py-2 text-text-muted">
                              {e.entityType}
                              {user && (
                                <span className="block text-xs">by {user.name}</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
                {crm.auditLog.length === 0 && (
                  <p className="p-4 text-sm text-text-muted">No audit entries yet.</p>
                )}
              </div>
            </div>
          )}

          {tab === 'Data' && (
            <>
              <Button
                variant="danger"
                onClick={() =>
                  toast.askConfirm({
                    title: 'Reset workspace?',
                    message:
                      'This reloads the app from the server. Unsaved changes will be lost.',
                    confirmLabel: 'Reset',
                    variant: 'danger',
                    onConfirm: () => {
                      crm.resetDemoData()
                      toast.info('Workspace reloaded')
                    },
                  })
                }
              >
                Reload from server
              </Button>
              <p className="mt-4 text-sm text-text-muted">
                Import/export CSV on Contacts and Leads pages. Documents and deals are stored in
                PostgreSQL when the API is connected.
              </p>
              <Textarea
                label="OpenAPI"
                className="mt-4 font-mono text-xs"
                rows={4}
                readOnly
                value="GET /api/v1/openapi — fetch the machine-readable API spec from your running server."
              />
            </>
          )}
        </article>
      </section>
    </>
  )
}
