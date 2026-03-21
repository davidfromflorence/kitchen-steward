'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/app/(app)/theme-context'

export default function ThemePicker() {
  const { resolved, setTheme } = useTheme()
  const isDark = resolved === 'dark'

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDark ? <Moon className="w-5 h-5 text-olive-600" /> : <Sun className="w-5 h-5 text-olive-600" />}
          <div>
            <h2 className="text-base font-bold text-slate-800">Dark mode</h2>
            <p className="text-xs text-slate-400">{isDark ? 'Attiva' : 'Disattiva'}</p>
          </div>
        </div>
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`relative w-12 h-7 rounded-full transition-colors ${isDark ? 'bg-olive-600' : 'bg-slate-300'}`}
        >
          <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform flex items-center justify-center ${isDark ? 'translate-x-5' : 'translate-x-0'}`}>
            {isDark ? <Moon className="w-3 h-3 text-olive-600" /> : <Sun className="w-3 h-3 text-amber-500" />}
          </div>
        </button>
      </div>
    </div>
  )
}
