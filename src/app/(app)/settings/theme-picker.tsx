'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/app/(app)/theme-context'

const options = [
  { value: 'light' as const, label: 'Chiaro', icon: Sun },
  { value: 'dark' as const, label: 'Scuro', icon: Moon },
  { value: 'system' as const, label: 'Sistema', icon: Monitor },
]

export default function ThemePicker() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 px-6 py-5">
        <Moon className="w-5 h-5 text-olive-600" />
        <h2 className="text-lg font-bold text-slate-800">Tema</h2>
      </div>
      <div className="px-6 py-5">
        <div className="grid grid-cols-3 gap-2">
          {options.map((opt) => {
            const active = theme === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                  active
                    ? 'bg-olive-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <opt.icon className="w-5 h-5" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
