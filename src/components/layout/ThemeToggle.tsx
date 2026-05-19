import { Monitor, Moon, Sun } from 'lucide-react'
import { useCrm } from '../../context/CrmContext'
import type { ThemeMode } from '../../types'

const modes: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
]

export function ThemeToggle() {
  const { preferences, setPreferences } = useCrm()
  const current = preferences.theme

  const cycle = () => {
    const i = modes.findIndex((m) => m.value === current)
    const next = modes[(i + 1) % modes.length]!
    setPreferences({ theme: next.value })
  }

  const Icon = modes.find((m) => m.value === current)?.icon ?? Monitor

  return (
    <button
      type="button"
      onClick={cycle}
      className="btn-icon"
      title={`Theme: ${current} (click to change)`}
      aria-label="Toggle theme"
    >
      <Icon size={18} />
    </button>
  )
}
