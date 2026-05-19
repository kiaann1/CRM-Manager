import { Check, Handshake } from 'lucide-react'

export function LoginSuccessSplash({ message = 'Opening your workspace…' }: { message?: string }) {
  return (
    <div className="login-success-splash" role="status" aria-live="polite" aria-label={message}>
      <div className="login-success-splash__glow" aria-hidden />
      <div className="login-success-splash__content">
        <div className="login-success-splash__ring" aria-hidden>
          <span className="login-success-splash__logo">
            <Handshake size={32} />
          </span>
          <span className="login-success-splash__check">
            <Check size={22} strokeWidth={3} />
          </span>
        </div>
        <p className="login-success-splash__title">You&apos;re in</p>
        <p className="login-success-splash__message">{message}</p>
        <div className="login-success-splash__bar" aria-hidden>
          <span className="login-success-splash__bar-fill" />
        </div>
      </div>
    </div>
  )
}
