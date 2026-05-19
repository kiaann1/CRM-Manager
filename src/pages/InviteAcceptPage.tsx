import { Handshake } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api/client'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<{
    organizationName: string
    email: string
    role: string
    existingUser: boolean
    expiresAt: string
  } | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link')
      setLoading(false)
      return
    }
    api
      .getInvitePreview(token)
      .then((p) => {
        setPreview(p)
        setError('')
      })
      .catch(() => setError('This invite is invalid or has expired'))
      .finally(() => setLoading(false))
  }, [token])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !preview) return
    setSubmitting(true)
    setError('')
    try {
      await api.acceptInvite({
        token,
        name: preview.existingUser ? undefined : name.trim(),
        password: password || undefined,
      })
      toast.success(`Welcome to ${preview.organizationName}`)
      window.location.href = '/'
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not accept invite'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
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
            <h1 className="text-xl font-bold text-text">Join workspace</h1>
            <p className="text-sm text-text-muted">Accept your CRM invitation</p>
          </div>
        </header>

        {loading && <p className="text-sm text-text-muted">Loading invite…</p>}

        {!loading && error && !preview && (
          <div className="space-y-4">
            <p className="text-sm text-rose-600">{error}</p>
            <Link to="/login" className="text-sm font-medium text-brand-600 hover:underline">
              Back to sign in
            </Link>
          </div>
        )}

        {preview && (
          <>
            <p className="mb-4 text-sm text-text-muted">
              You&apos;ve been invited to join{' '}
              <strong className="text-text">{preview.organizationName}</strong> as{' '}
              <span className="capitalize">{preview.role}</span>.
            </p>
            <p className="mb-4 text-sm">
              Email: <strong>{preview.email}</strong>
            </p>

            <form className="space-y-4" onSubmit={submit}>
              {!preview.existingUser && (
                <Input
                  label="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              )}
              <Input
                label={preview.existingUser ? 'Password' : 'Create password'}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={preview.existingUser ? 'current-password' : 'new-password'}
              />
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Joining…' : 'Accept invite'}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-text-muted">
              <button
                type="button"
                className="text-brand-600 hover:underline"
                onClick={() => navigate('/login')}
              >
                Sign in with a different account
              </button>
            </p>
          </>
        )}
      </article>
    </div>
  )
}
