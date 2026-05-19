import { ExternalLink, RefreshCw, Zap } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { api } from '../../lib/api/client'
import type { Integration } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

const categoryLabels: Record<string, string> = {
  communication: 'Communication',
  calendar: 'Calendar & email',
  automation: 'Automation',
  crm: 'CRM',
  billing: 'Billing',
}

const brandColors: Record<string, string> = {
  slack: 'bg-[#4A154B] text-white',
  teams: 'bg-[#464EB8] text-white',
  gmail: 'bg-[#EA4335] text-white',
  outlook: 'bg-[#0078D4] text-white',
  zapier: 'bg-[#FF4A00] text-white',
  make: 'bg-[#6D00CC] text-white',
  hubspot: 'bg-[#FF7A59] text-white',
  stripe: 'bg-[#635BFF] text-white',
}

export function IntegrationCard({
  integration,
  onUpdated,
}: {
  integration: Integration
  onUpdated: () => void
}) {
  const toast = useToast()
  const [config, setConfig] = useState<Record<string, string>>(() => {
    const c = integration.config ?? {}
    const out: Record<string, string> = {}
    for (const f of integration.fields ?? []) {
      const v = c[f.key]
      out[f.key] = typeof v === 'string' ? v : ''
    }
    return out
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const badge = brandColors[integration.type] ?? 'bg-brand-600 text-white'

  const save = async (patch: { enabled?: boolean; config?: Record<string, unknown> }) => {
    setSaving(true)
    try {
      await api.updateIntegration(integration.type, patch)
      onUpdated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleEnabled = async (enabled: boolean) => {
    await save({ enabled, config })
    toast.success(`${integration.name} ${enabled ? 'enabled' : 'disabled'}`)
  }

  const saveConfig = async () => {
    await save({ config })
    toast.success('Settings saved')
  }

  const test = async () => {
    setTesting(true)
    try {
      const res = await api.testIntegration(integration.type)
      toast.success(res.message)
      onUpdated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Test failed')
    } finally {
      setTesting(false)
    }
  }

  const sync = async () => {
    setSyncing(true)
    try {
      const res = await api.syncIntegration(integration.type)
      toast.success(res.message)
      onUpdated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const connectSso = () => {
    if (!integration.ssoProvider) return
    window.location.href = api.ssoStartUrl(integration.ssoProvider)
  }

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface shadow-sm ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/5">
      <div className="flex items-start gap-4 border-b border-border p-5 dark:border-slate-700">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${badge}`}
        >
          {integration.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-text">{integration.name}</h3>
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              {categoryLabels[integration.category ?? 'automation'] ?? integration.category}
            </span>
            {integration.enabled && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                Active
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-muted">{integration.description}</p>
          {integration.lastTestAt && (
            <p className="mt-1 text-xs text-text-muted">
              Last test: {new Date(integration.lastTestAt).toLocaleString()}
              {integration.lastTestOk === false && ' (failed)'}
              {integration.lastTestOk === true && ' ✓'}
            </p>
          )}
          {integration.lastSyncAt && (
            <p className="text-xs text-text-muted">
              Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
            </p>
          )}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={integration.enabled}
            disabled={saving}
            onChange={(e) => void toggleEnabled(e.target.checked)}
          />
          On
        </label>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        {(integration.fields ?? []).length > 0 && (
          <div className="space-y-3">
            {(integration.fields ?? []).map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
                placeholder={field.placeholder}
                value={config[field.key] ?? ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            ))}
            <Button variant="secondary" disabled={saving} onClick={() => void saveConfig()}>
              Save credentials
            </Button>
          </div>
        )}

        {integration.ssoProvider && (
          <div className="rounded-lg border border-dashed border-border p-3 dark:border-slate-600">
            <p className="text-sm text-text-muted">
              {integration.ssoAvailable
                ? 'Connect your workspace account for calendar and email sync.'
                : 'Configure Google/Microsoft SSO in server .env to enable OAuth.'}
            </p>
            {integration.ssoAvailable && (
              <Button className="mt-2" variant="secondary" onClick={connectSso}>
                Connect {integration.ssoProvider === 'google' ? 'Google' : 'Microsoft'}
              </Button>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4 dark:border-slate-700">
          <Button variant="secondary" disabled={testing || saving} onClick={() => void test()}>
            <Zap size={14} /> {testing ? 'Testing…' : 'Test connection'}
          </Button>
          {(integration.type === 'hubspot' || integration.ssoProvider) && (
            <Button variant="secondary" disabled={syncing || !integration.enabled} onClick={() => void sync()}>
              <RefreshCw size={14} /> {syncing ? 'Syncing…' : 'Sync now'}
            </Button>
          )}
          {integration.docsUrl && (
            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
            >
              Documentation <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
