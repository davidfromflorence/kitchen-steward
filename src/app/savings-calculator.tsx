'use client'

import { useState } from 'react'
import { Users, ShoppingCart, Trash2 } from 'lucide-react'

const COST_PER_PERSON_MONTHLY = 250 // €/month average grocery spend in Italy
const WASTE_PERCENTAGE_BASE = 0.28 // 28% average food waste
const KS_REDUCTION = 0.65 // KS reduces waste by 65%
const CO2_PER_EURO_WASTED = 0.8 // kg CO2 per € of food wasted

export default function SavingsCalculator() {
  const [members, setMembers] = useState(3)
  const [mealPrep, setMealPrep] = useState(2) // 1=low, 2=medium, 3=high
  const [awareness, setAwareness] = useState(1) // 1=low, 2=medium, 3=high

  // More members = more waste, less meal prep = more waste, less awareness = more waste
  const wasteMultiplier = 1 + (members - 1) * 0.15
  const mealPrepFactor = mealPrep === 1 ? 1.3 : mealPrep === 2 ? 1.0 : 0.8
  const awarenessFactor = awareness === 1 ? 1.4 : awareness === 2 ? 1.0 : 0.7

  const monthlySpend = COST_PER_PERSON_MONTHLY * members
  const yearlySpend = monthlySpend * 12
  const wasteRate = Math.min(WASTE_PERCENTAGE_BASE * wasteMultiplier * mealPrepFactor * awarenessFactor, 0.45)
  const yearlyWaste = yearlySpend * wasteRate
  const yearlySaved = yearlyWaste * KS_REDUCTION
  const co2Saved = yearlySaved * CO2_PER_EURO_WASTED

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">Quanto puoi risparmiare?</h3>

        {/* Sliders */}
        <div className="space-y-6 mb-8">
          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-olive-600" />
                Membri della famiglia
              </label>
              <span className="text-lg font-bold text-olive-600">{members}</span>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              value={members}
              onChange={(e) => setMembers(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-olive-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-olive-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1</span><span>3</span><span>6</span>
            </div>
          </div>

          {/* Meal prep frequency */}
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
              <ShoppingCart className="w-4 h-4 text-olive-600" />
              Quanto pianifichi i pasti?
            </label>
            <div className="flex gap-2">
              {[
                { v: 1, label: 'Poco', desc: 'Compro e vediamo' },
                { v: 2, label: 'Abbastanza', desc: 'Piano settimanale vago' },
                { v: 3, label: 'Molto', desc: 'Ogni pasto pianificato' },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setMealPrep(o.v)}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-center transition-all ${
                    mealPrep === o.v
                      ? 'bg-olive-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <p className="text-sm font-semibold">{o.label}</p>
                  <p className={`text-[10px] mt-0.5 ${mealPrep === o.v ? 'text-olive-100' : 'text-slate-400'}`}>{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Awareness */}
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
              <Trash2 className="w-4 h-4 text-olive-600" />
              Quanto cibo butti via?
            </label>
            <div className="flex gap-2">
              {[
                { v: 1, label: 'Tanto', desc: 'Spesso trovo cose scadute' },
                { v: 2, label: 'Un po\'', desc: 'Qualcosa ogni settimana' },
                { v: 3, label: 'Poco', desc: 'Sto già attento' },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setAwareness(o.v)}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-center transition-all ${
                    awareness === o.v
                      ? 'bg-olive-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <p className="text-sm font-semibold">{o.label}</p>
                  <p className={`text-[10px] mt-0.5 ${awareness === o.v ? 'text-olive-100' : 'text-slate-400'}`}>{o.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-gradient-to-br from-olive-600 to-emerald-600 p-6 md:p-8 text-white">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-olive-200 text-xs font-semibold uppercase tracking-wider">Spesa annua</p>
            <p className="text-2xl font-bold">€{yearlySpend.toLocaleString('it-IT')}</p>
          </div>
          <div>
            <p className="text-olive-200 text-xs font-semibold uppercase tracking-wider">Di cui sprecato</p>
            <p className="text-2xl font-bold text-red-300">€{Math.round(yearlyWaste).toLocaleString('it-IT')}</p>
          </div>
        </div>

        {/* Waste bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-olive-200 mb-1">
            <span>Il tuo spreco: {Math.round(wasteRate * 100)}%</span>
            <span>Con KS: {Math.round(wasteRate * (1 - KS_REDUCTION) * 100)}%</span>
          </div>
          <div className="h-4 bg-white/20 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-red-400/80 rounded-full absolute left-0 top-0 transition-all duration-500"
              style={{ width: `${wasteRate * 100}%` }}
            />
            <div
              className="h-full bg-emerald-300 rounded-full absolute left-0 top-0 transition-all duration-500"
              style={{ width: `${wasteRate * (1 - KS_REDUCTION) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-olive-200">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Senza KS</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-300" /> Con KS</span>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-5 text-center">
          <p className="text-olive-200 text-xs font-semibold uppercase tracking-wider mb-1">Con Kitchen Steward risparmi</p>
          <p className="text-4xl md:text-5xl font-bold">€{Math.round(yearlySaved).toLocaleString('it-IT')}<span className="text-lg font-normal text-olive-200">/anno</span></p>
          <p className="text-olive-200 text-sm mt-2">e risparmi {Math.round(co2Saved)}kg di CO₂</p>
        </div>

        <a
          href="/login"
          className="block w-full mt-5 bg-white text-olive-700 font-semibold py-3.5 rounded-xl text-center hover:bg-olive-50 active:scale-95 transition-all"
        >
          Inizia a risparmiare — è gratis
        </a>
      </div>
    </div>
  )
}
