'use client'

import { useState, useEffect } from 'react'
import { User, Check } from 'lucide-react'
import {
  loadFoodProfile,
  saveFoodProfile,
  PORTION_LABELS,
  PORTION_EMOJI,
  PORTION_MULTIPLIER,
  ACTIVITY_LABELS,
  ACTIVITY_EMOJI,
  type FoodProfile,
  type PortionSize,
  type ActivityLevel,
} from '@/lib/food-profile'

const PORTION_OPTIONS: PortionSize[] = ['piccola', 'normale', 'grande', 'abbondante']
const ACTIVITY_OPTIONS: ActivityLevel[] = ['sedentario', 'moderato', 'attivo', 'molto_attivo']

export default function FoodProfileEditor() {
  const [profile, setProfile] = useState<FoodProfile | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setProfile(loadFoodProfile())
  }, [])

  if (!profile) return null

  function update(patch: Partial<FoodProfile>) {
    setProfile((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      saveFoodProfile(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
      return next
    })
  }

  const multiplier = PORTION_MULTIPLIER[profile.portionSize]

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/50 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-olive-600" />
          <h2 className="text-lg font-bold text-slate-800">Profilo alimentare</h2>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-olive-600 bg-olive-50 px-2.5 py-1 rounded-full">
            <Check className="w-3 h-3" /> Salvato
          </span>
        )}
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Portion size — the key setting */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Quanto mangi di solito?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PORTION_OPTIONS.map((size) => {
              const active = profile.portionSize === size
              return (
                <button
                  key={size}
                  onClick={() => update({ portionSize: size })}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98] ${
                    active
                      ? 'bg-olive-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-olive-300'
                  }`}
                >
                  <span className="text-xl">{PORTION_EMOJI[size]}</span>
                  <div>
                    <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-800'}`}>
                      {PORTION_LABELS[size]}
                    </p>
                    <p className={`text-[11px] ${active ? 'text-white/70' : 'text-slate-400'}`}>
                      {PORTION_MULTIPLIER[size]}x porzione
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Quando dici &quot;ho mangiato pasta&quot;, useremo porzioni da{' '}
            <strong className="text-slate-600">{Math.round(80 * multiplier)}g</strong> invece di 80g standard.
          </p>
        </div>

        {/* Weight */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Peso (kg) — opzionale
          </label>
          <input
            type="number"
            value={profile.weight ?? ''}
            onChange={(e) => update({ weight: e.target.value ? Number(e.target.value) : null })}
            placeholder="Es: 72"
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-500 transition-all text-sm"
          />
        </div>

        {/* Activity level */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Attività fisica
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ACTIVITY_OPTIONS.map((level) => {
              const active = profile.activityLevel === level
              return (
                <button
                  key={level}
                  onClick={() => update({ activityLevel: level })}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-center transition-all active:scale-[0.98] ${
                    active
                      ? 'bg-olive-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-olive-300'
                  }`}
                >
                  <span className="text-lg">{ACTIVITY_EMOJI[level]}</span>
                  <span className="text-[10px] font-semibold">{ACTIVITY_LABELS[level]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Diet notes */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Note alimentari
          </label>
          <textarea
            value={profile.dietNotes}
            onChange={(e) => update({ dietNotes: e.target.value })}
            placeholder="Es: la sera mangio leggero, sono intollerante al lattosio, a pranzo mangio di più..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-500 transition-all text-sm resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">
            Queste info aiutano l&apos;AI a capire meglio quanto sottrarre dal frigo.
          </p>
        </div>
      </div>
    </div>
  )
}
