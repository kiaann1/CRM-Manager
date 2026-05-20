import { Moon, Sun } from 'lucide-react'
import { useCrm } from '../../context/CrmContext'
import { normalizeTheme } from '../../lib/theme'

export function ThemeToggle() {
  const { preferences, setPreferences } = useCrm()
  const theme = normalizeTheme(preferences.theme)
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setPreferences({ theme: isDark ? 'light' : 'dark' })}
      className="btn-icon"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
