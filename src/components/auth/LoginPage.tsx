import { Handshake } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../../lib/api/client'
import { useCrm } from '../../context/CrmContext'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { PasswordInput } from '../ui/PasswordInput'
import { LoginSuccessSplash } from './LoginSuccessSplash'

type LoginPhase = 'idle' | 'submitting' | 'success'

const LOGIN_ANIMATION_MS = 1300

export function LoginPage() {
  const { login, session } = useCrm()
  const toast = useToast()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('admin@crm.local')
  const [password, setPassword] = useState('demo1234')
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [sso, setSso] = useState({ google: false, microsoft: false, oidc: false })
  const [phase, setPhase] = useState<LoginPhase>('idle')

  useEffect(() => {
    api.ssoProviders().then(setSso).catch(() => undefined)
  }, [])

  if (session && phase === 'idle') {
    return <Navigate to="/" replace />
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPhase('submitting')

    try {
      if (mode === 'register') {
        await api.register({
          email,
          password,
          name,
          organizationName: orgName,
        })
        await login(email, password)
        toast.success('Account created')
      } else {
        await login(email, password)
      }

      setPhase('success')
      await new Promise((resolve) => setTimeout(resolve, LOGIN_ANIMATION_MS))
      navigate('/', { replace: true })
    } catch (err) {
      setPhase('idle')
      const msg =
        err instanceof ApiError && err.status === 401
          ? 'Invalid email or password'
          : err instanceof Error
            ? err.message
            : 'Authentication failed'
      setError(msg)
      toast.error(msg)
    }
  }

  const busy = phase !== 'idle'
  const successMessage =
    mode === 'register' ? 'Setting up your workspace…' : 'Opening your workspace…'

  return (
    <div className="login-screen relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-muted p-4">
      <article
        className={`card w-full max-w-md p-8 shadow-xl transition-opacity ${
          phase === 'success' ? 'login-card-exit' : busy ? 'login-card-dim' : ''
        }`}
      >
        <header className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Handshake size={22} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-text">CRM Manager</h1>
            <p className="text-sm text-text-muted">
              {mode === 'login' ? 'Sign in to your workspace' : 'Create your organization'}
            </p>
          </div>
        </header>

        {(sso.google || sso.microsoft || sso.oidc) && (
          <div className="mb-4 flex gap-2">
            {sso.google && (
              <a
                href={api.ssoStartUrl('google')}
                className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-medium hover:bg-surface-muted dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Google
              </a>
            )}
            {sso.microsoft && (
              <a
                href={api.ssoStartUrl('microsoft')}
                className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-medium hover:bg-surface-muted dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Microsoft
              </a>
            )}
            {sso.oidc && (
              <a
                href={api.ssoStartUrl('oidc')}
                className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-medium hover:bg-surface-muted dark:border-slate-700 dark:hover:bg-slate-800"
              >
                SSO
              </a>
            )}
          </div>
        )}

        <form className="space-y-4" onSubmit={submit}>
          {mode === 'register' && (
            <>
              <Input
                label="Your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
              />
              <Input
                label="Organization name"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={busy}
              />
            </>
          )}
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
          <PasswordInput
            label="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {phase === 'submitting' ? (
              <>
                <span className="login-btn-spinner" aria-hidden />
                {mode === 'login' ? 'Signing in…' : 'Creating account…'}
              </>
            ) : mode === 'login' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-text-muted">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button
                type="button"
                className="font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                disabled={busy}
                onClick={() => setMode('register')}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Have an account?{' '}
              <button
                type="button"
                className="font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                disabled={busy}
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </>
          )}
        </p>
        <p className="mt-2 text-center text-xs text-text-muted">
          After seeding the DB: admin@crm.local / demo1234
        </p>
      </article>

      {phase === 'success' && <LoginSuccessSplash message={successMessage} />}
    </div>
  )
}
