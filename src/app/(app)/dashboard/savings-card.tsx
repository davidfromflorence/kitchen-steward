'use client'

import { useState, useEffect } from 'react'
import { getSavings, type SavingsData } from '@/app/actions/savings'
import { Leaf, TrendingUp } from 'lucide-react'

export default function SavingsCard() {
  const [data, setData] = useState<SavingsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSavings().then((d) => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-olive-50 to-emerald-50 rounded-2xl border border-olive-200/50 p-5 animate-pulse">
        <div className="h-5 w-40 bg-olive-100 rounded mb-4" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-olive-100/50 rounded-xl" />
          <div className="h-16 bg-olive-100/50 rounded-xl" />
          <div className="h-16 bg-olive-100/50 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data || (data.itemsSaved === 0 && data.mealsLogged === 0)) return null

  return (
    <div className="bg-gradient-to-br from-olive-50 to-emerald-50 rounded-2xl border border-olive-200/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Leaf className="w-4 h-4 text-olive-600" />
          Il tuo impatto
        </h2>
        {data.thisWeekEuros > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-olive-700 bg-olive-100 px-2.5 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            +€{data.thisWeekEuros.toFixed(0)} questa settimana
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/70 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-slate-900">€{data.totalEuros.toFixed(0)}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Risparmiati</p>
        </div>
        <div className="bg-white/70 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{data.totalKg.toFixed(1)}kg</p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Cibo salvato</p>
        </div>
        <div className="bg-white/70 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{data.totalCO2.toFixed(1)}kg</p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">CO₂ evitata</p>
        </div>
      </div>

      {(data.itemsSaved > 0 || data.mealsLogged > 0) && (
        <div className="flex items-center gap-4 mt-3 text-xs text-olive-700">
          {data.itemsSaved > 0 && (
            <span>{data.itemsSaved} prodotti usati</span>
          )}
          {data.mealsLogged > 0 && (
            <span>{data.mealsLogged} pasti registrati</span>
          )}
          {data.itemsSavedThisWeek > 0 && (
            <span className="font-semibold">{data.itemsSavedThisWeek} salvati questa settimana</span>
          )}
        </div>
      )}
    </div>
  )
}
