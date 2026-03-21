'use client'

import { useState } from 'react'
import { Plus, UtensilsCrossed, Repeat, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import AddItemModal from '@/app/(app)/fridge/add-item-modal'

const actions = [
  { key: 'add', label: 'Aggiungi', icon: Plus, color: 'bg-olive-100 text-olive-600' },
  { key: 'meal', label: 'Ho mangiato', icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-600' },
  { key: 'habit', label: 'Abitudini', icon: Repeat, color: 'bg-violet-100 text-violet-600' },
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
            <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setOpen(false)} />
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2.5">
              {actions.map((a, i) => (
                <button
                  key={a.key}
                  onClick={() => handle(a.key)}
                  className="flex items-center gap-3 bg-white border border-slate-200 shadow-lg rounded-2xl pl-3 pr-5 py-2.5 text-sm font-semibold text-slate-800 active:scale-95 transition-all whitespace-nowrap"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className={`w-9 h-9 rounded-xl ${a.color} flex items-center justify-center`}>
                    <a.icon className="w-4.5 h-4.5" />
                  </div>
                  {a.label}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => setOpen(!open)}
          className={`w-13 h-13 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200 ${
            open
              ? 'bg-slate-800 rotate-45 scale-90'
              : 'bg-olive-600 hover:bg-olive-700 active:scale-90'
          }`}
          style={{ width: 52, height: 52 }}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* ── Desktop floating bar ── */}
      <div className="hidden md:flex fixed bottom-6 left-64 right-0 z-40 justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center bg-slate-900 rounded-2xl shadow-xl px-1.5 py-1.5">
          {actions.map((a, i) => (
            <div key={a.key} className="flex items-center">
              {i > 0 && <div className="w-px h-5 bg-slate-700 mx-0.5" />}
              <button
                onClick={() => handle(a.key)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors active:scale-95"
              >
                <a.icon className="w-4 h-4" />
                {a.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      <AddItemModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </>
  )
}
