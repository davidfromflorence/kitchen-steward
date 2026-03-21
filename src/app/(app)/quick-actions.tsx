'use client'

import { useState } from 'react'
import { Plus, UtensilsCrossed, Repeat } from 'lucide-react'
import { usePathname } from 'next/navigation'
import AddItemModal from '@/app/(app)/fridge/add-item-modal'

const actions = [
  { key: 'add', label: 'Aggiungi', icon: Plus, bg: 'bg-olive-600', hover: 'hover:bg-olive-700', text: 'text-white' },
  { key: 'meal', label: 'Ho mangiato', icon: UtensilsCrossed, bg: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-white' },
  { key: 'habit', label: 'Abitudini', icon: Repeat, bg: 'bg-violet-600', hover: 'hover:bg-violet-700', text: 'text-white' },
] as const

export default function QuickActions() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const showOnPages = ['/dashboard', '/fridge', '/recipes', '/shopping-list', '/analytics', '/learn', '/badges']
  if (!showOnPages.some((p) => pathname.startsWith(p))) return null

  function handle(key: string) {
    setOpen(false)
    if (key === 'add') setShowAdd(true)
    else if (key === 'meal') window.location.href = '/fridge?meal=true'
    else if (key === 'habit') window.location.href = '/fridge?habit=true'
  }

  return (
    <>
      {/* ── Mobile FAB ── */}
      <div className="md:hidden fixed bottom-[72px] left-1/2 -translate-x-1/2 z-40">
        {open && (
          <>
            <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setOpen(false)} />
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3">
              {actions.map((a) => (
                <button
                  key={a.key}
                  onClick={() => handle(a.key)}
                  className={`flex items-center gap-2.5 ${a.bg} ${a.hover} ${a.text} shadow-xl rounded-full pl-4 pr-5 py-3 text-sm font-bold active:scale-95 transition-all whitespace-nowrap`}
                >
                  <a.icon className="w-5 h-5" />
                  {a.label}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => setOpen(!open)}
          className={`rounded-full shadow-xl flex items-center justify-center transition-all duration-200 ${
            open
              ? 'bg-slate-800 rotate-45 scale-90'
              : 'bg-olive-600 hover:bg-olive-700 active:scale-90'
          }`}
          style={{ width: 56, height: 56 }}
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* ── Desktop floating bar ── */}
      <div className="hidden md:flex fixed bottom-6 left-64 right-0 z-40 justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-xl px-2 py-2">
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={() => handle(a.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${a.bg} ${a.hover} ${a.text} transition-colors active:scale-95`}
            >
              <a.icon className="w-4 h-4" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <AddItemModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </>
  )
}
