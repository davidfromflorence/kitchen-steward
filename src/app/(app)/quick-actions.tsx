'use client'

import { useState } from 'react'
import { Plus, UtensilsCrossed, Repeat, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import AddItemModal from '@/app/(app)/fridge/add-item-modal'

export default function QuickActions() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  // Only show on main app pages, not settings/household
  const showOnPages = ['/dashboard', '/fridge', '/recipes', '/shopping-list', '/analytics', '/learn', '/badges']
  if (!showOnPages.some((p) => pathname.startsWith(p))) return null

  function handleAdd() {
    setOpen(false)
    setShowAdd(true)
  }

  function handleMeal() {
    setOpen(false)
    // Navigate to fridge with meal modal open
    window.location.href = '/fridge?meal=true'
  }

  function handleHabit() {
    setOpen(false)
    window.location.href = '/fridge?habit=true'
  }

  return (
    <>
      {/* ── Mobile FAB ── */}
      <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40 safe-bottom">
        {/* Expanded options */}
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <button
                onClick={handleHabit}
                className="flex items-center gap-2.5 bg-white border border-slate-200 shadow-lg rounded-full pl-4 pr-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                  <Repeat className="w-4 h-4 text-violet-600" />
                </div>
                Abitudini
              </button>
              <button
                onClick={handleMeal}
                className="flex items-center gap-2.5 bg-white border border-slate-200 shadow-lg rounded-full pl-4 pr-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                </div>
                Ho mangiato
              </button>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2.5 bg-white border border-slate-200 shadow-lg rounded-full pl-4 pr-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-olive-600" />
                </div>
                Aggiungi
              </button>
            </div>
          </>
        )}

        {/* FAB button */}
        <button
          onClick={() => setOpen(!open)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-90 ${
            open
              ? 'bg-slate-900 rotate-45'
              : 'bg-olive-600 hover:bg-olive-700'
          }`}
        >
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* ── Desktop floating bar ── */}
      <div className="hidden md:flex fixed bottom-6 left-64 right-0 z-40 justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg px-2 py-1.5">
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-olive-700 hover:bg-olive-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Aggiungi
          </button>
          <div className="w-px h-6 bg-slate-200" />
          <button
            onClick={handleMeal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
          >
            <UtensilsCrossed className="w-4 h-4" />
            Ho mangiato
          </button>
          <div className="w-px h-6 bg-slate-200" />
          <button
            onClick={handleHabit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-violet-600 hover:bg-violet-50 transition-colors"
          >
            <Repeat className="w-4 h-4" />
            Abitudini
          </button>
        </div>
      </div>

      <AddItemModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </>
  )
}
