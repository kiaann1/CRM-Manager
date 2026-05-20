import { Check } from 'lucide-react'
import {
  PASSWORD_MIN_LENGTH,
  passwordHasDigit,
  passwordHasMinLength,
  passwordHasSpecial,
  passwordHasUppercase,
} from '../../lib/passwordPolicy'

function CheckRow({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          met
            ? 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-500'
            : 'border-border bg-transparent text-transparent dark:border-slate-600'
        }`}
        aria-hidden
      >
        {met && <Check size={12} strokeWidth={3} className="text-white" />}
      </span>
      <span className={met ? 'font-medium text-text' : 'text-text-muted'}>{label}</span>
    </li>
  )
}

export function PasswordChangeChecklist({ newPassword }: { newPassword: string }) {
  return (
    <div className="max-w-md rounded-lg border border-border bg-surface-muted/80 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">New password checklist</p>
      <ul className="mt-2 space-y-2" aria-live="polite">
        <CheckRow met={passwordHasMinLength(newPassword)} label={`At least ${PASSWORD_MIN_LENGTH} characters`} />
        <CheckRow met={passwordHasUppercase(newPassword)} label="One uppercase letter" />
        <CheckRow met={passwordHasDigit(newPassword)} label="One number" />
        <CheckRow met={passwordHasSpecial(newPassword)} label="One special character (!@#$…)" />
      </ul>
    </div>
  )
}
