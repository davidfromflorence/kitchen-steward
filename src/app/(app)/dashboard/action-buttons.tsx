'use client'

import { useState } from 'react'
import { Plus, UtensilsCrossed, Check, X, Loader2 } from 'lucide-react'
import AddItemModal from '@/app/(app)/fridge/add-item-modal'
import { logMeal } from '@/app/actions/inventory'

export default function ActionButtons() {
  const [showAdd, setShowAdd] = useState(false)
  const [showMeal, setShowMeal] = useState(false)
  const [mealInput, setMealInput] = useState('')
  const [mealLoading, setMealLoading] = useState(false)
  const [mealResult, setMealResult] = useState<{
    used: Array<{ name: string; subtracted: number; unit: string; removed: boolean }>
    error?: string
  } | null>(null)

  async function handleLogMeal() {
    if (!mealInput.trim() || mealLoading) return
    setMealLoading(true)
    setMealResult(null)
    try {
      const result = await logMeal(mealInput.trim())
      setMealResult(result)
      if (result.success) setMealInput('')
    } catch {
      setMealResult({ error: 'Errore. Riprova.', used: [] })
    } finally {
      setMealLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 bg-olive-600 text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-olive-700 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Aggiungi
        </button>
        <button
          onClick={() => setShowMeal(true)}
          className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-orange-600 active:scale-95 transition-all"
        >
          <UtensilsCrossed className="w-4 h-4" />
          Mangiato
        </button>
      </div>

      <AddItemModal isOpen={showAdd} onClose={() => setShowAdd(false)} />

      {showMeal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => !mealLoading && setShowMeal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 pb-8 sm:pb-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ho mangiato...</h3>
                <p className="text-xs text-slate-500">Scrivi cosa hai mangiato e aggiorno il frigo</p>
              </div>
            </div>

            {mealResult && (
              <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                mealResult.error
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-olive-50 border border-olive-200 text-olive-800'
              }`}>
                {mealResult.error ? (
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />
                    {mealResult.error}
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold flex items-center gap-1.5 mb-1">
                      <Check className="w-4 h-4" /> Frigo aggiornato!
                    </p>
                    {mealResult.used.map((u, i) => (
                      <p key={i} className="text-xs ml-5">
                        {u.removed ? '🗑️' : '📉'} {u.name}: -{u.subtracted} {u.unit} {u.removed ? '(finito)' : ''}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={mealInput}
                onChange={(e) => setMealInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogMeal()}
                placeholder='Es: "Pasta al pesto per 2"'
                disabled={mealLoading}
                autoFocus
                className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {['Pasta', 'Insalata', 'Panino', 'Frittata', 'Riso'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setMealInput(prev => prev ? prev : s.toLowerCase())}
                    className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={handleLogMeal}
                disabled={!mealInput.trim() || mealLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {mealLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Aggiorno il frigo...</>
                ) : (
                  <><Check className="w-4 h-4" /> Aggiorna frigo</>
                )}
              </button>
              <button
                onClick={() => { setShowMeal(false); setMealResult(null) }}
                disabled={mealLoading}
                className="w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
