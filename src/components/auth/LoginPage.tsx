import { Handshake } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../../lib/api/client'
import { useCrm } from '../../context/CrmContext'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function LoginPage() {
  const { login, session } = useCrm()
  const toast = useToast()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('admin@crm.local')
  const [password, setPassword] = useState('demo1234')
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [sso, setSso] = useState({ google: false, microsoft: false, oidc: false })

  useEffect(() => {
    api.ssoProviders().then(setSso).catch(() => undefined)
  }, [])

  if (session) return <Navigate to="/" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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
        const ok = await login(email, password)
        if (!ok) {
          setError('Invalid email or password')
          toast.error('Invalid email or password')
        } else {
          toast.success('Welcome back')
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="login-screen flex min-h-screen items-center justify-center bg-surface-muted p-4">
      <article className="card w-full max-w-md p-8 shadow-xl">
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
              <Input label="Your name" required value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                label="Organization name"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </>
          )}
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-text-muted">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button type="button" className="font-medium text-brand-600 hover:text-brand-700" onClick={() => setMode('register')}>
                Register
              </button>
            </>
          ) : (
            <>
              Have an account?{' '}
              <button type="button" className="font-medium text-brand-600 hover:text-brand-700" onClick={() => setMode('login')}>
                Sign in
              </button>
            </>
          )}
        </p>
        <p className="mt-2 text-center text-xs text-text-muted">
          After seeding the DB: admin@crm.local / demo1234
        </p>
      </article>
    </div>
  )
}
