'use client'

import {
  TrendingUp,
  BarChart3,
  Leaf,
  Flame,
  Crown,
} from 'lucide-react'

interface Stats {
  totalItems: number
  totalEuros: number
  totalKg: number
  totalCO2: number
  streak: number
  itemsUsed: number
  mealsLogged: number
  savedBeforeExpiry: number
  itemsAdded: number
  expired: number
  expiringSoon: number
  thisWeekUsed: number
  thisWeekMeals: number
  thisWeekSaved: number
}

interface WeeklyPoint {
  label: string
  used: number
  meals: number
  saved: number
}

interface CategorySlice {
  name: string
  percentage: number
}

interface LeaderboardMember {
  id: string
  name: string
  xp: number
  streak: number
  itemsUsed: number
  saved: number
  isCurrentUser: boolean
}

interface Props {
  stats: Stats
  weeklyData: WeeklyPoint[]
  categoryBreakdown: CategorySlice[]
  leaderboard: LeaderboardMember[]
}

const CATEGORY_COLORS = ['#587519', '#6b8e23', '#8ea85a', '#adc07f', '#cdd9b0']

export default function AnalyticsClient({ stats, weeklyData, categoryBreakdown, leaderboard }: Props) {
  const maxWeeklyUsed = Math.max(...weeklyData.map(w => w.used + w.saved), 1)
  const hasActivity = stats.itemsUsed > 0 || stats.mealsLogged > 0

  return (
    <div className="flex flex-col gap-5 animate-in py-6 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-olive-600" />
            Statistiche
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Dati reali dal tuo utilizzo</p>
        </div>
        {stats.streak > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-bold">{stats.streak}d streak</span>
          </div>
        )}
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 font-medium">Risparmiati</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {'\u20AC'}{stats.totalEuros}
          </p>
          {stats.thisWeekUsed > 0 && (
            <p className="text-[10px] text-olive-600 font-semibold mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {stats.thisWeekUsed} usati questa sett.
            </p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 font-medium">Cibo salvato</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalKg}kg</p>
          <p className="text-[10px] text-slate-400 mt-1">{stats.totalCO2}kg CO{'\u2082'} evitata</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 font-medium">Pasti registrati</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.mealsLogged}</p>
          {stats.thisWeekMeals > 0 && (
            <p className="text-[10px] text-olive-600 font-semibold mt-1">{stats.thisWeekMeals} questa sett.</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 font-medium">Salvati in tempo</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.savedBeforeExpiry}</p>
          <p className="text-[10px] text-slate-400 mt-1">prima della scadenza</p>
        </div>
      </div>

      {/* Fridge health */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Stato del frigo</h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-olive-500" />
            <span className="text-sm text-slate-600">{stats.totalItems} prodotti</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-sm text-slate-600">{stats.expiringSoon} in scadenza</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-sm text-slate-600">{stats.expired} scaduti</span>
          </div>
        </div>
        {stats.totalItems > 0 && (
          <div className="mt-3 h-3 rounded-full bg-slate-100 overflow-hidden flex">
            <div
              className="h-full bg-olive-500"
              style={{ width: `${((stats.totalItems - stats.expiringSoon - stats.expired) / stats.totalItems) * 100}%` }}
            />
            <div
              className="h-full bg-amber-400"
              style={{ width: `${(stats.expiringSoon / stats.totalItems) * 100}%` }}
            />
            <div
              className="h-full bg-red-400"
              style={{ width: `${(stats.expired / stats.totalItems) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Weekly activity chart */}
      {hasActivity && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-800">Attività settimanale</h2>
            <span className="text-[10px] text-slate-400 font-medium">Ultime 8 settimane</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Prodotti usati e salvati prima della scadenza</p>

          <div className="flex items-end gap-2 h-32">
            {weeklyData.map((w, i) => {
              const total = w.used + w.saved
              const heightPct = (total / maxWeeklyUsed) * 100
              const savedPct = total > 0 ? (w.saved / total) * 100 : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  {total > 0 && (
                    <span className="text-[9px] font-semibold text-slate-500">{total}</span>
                  )}
                  <div className="w-full flex flex-col justify-end h-20">
                    <div
                      className="w-full rounded-t-md overflow-hidden"
                      style={{ height: `${heightPct}%`, minHeight: total > 0 ? '4px' : '0' }}
                    >
                      <div className="w-full bg-olive-400" style={{ height: `${100 - savedPct}%` }} />
                      <div className="w-full bg-emerald-500" style={{ height: `${savedPct}%` }} />
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400">{w.label}</span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-olive-400" /> Usati
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Salvati prima della scadenza
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Categorie nel frigo</h2>
            <div className="flex flex-col gap-3">
              {categoryBreakdown.map((cat, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{cat.name}</span>
                    <span className="text-xs font-bold text-slate-500">{cat.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[i] || '#cdd9b0',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Classifica famiglia</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Basata su XP reali</p>
            </div>
            <div className="divide-y divide-slate-100">
              {leaderboard.map((m, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`
                return (
                  <div
                    key={m.id}
                    className={`px-5 py-3 flex items-center gap-3 ${m.isCurrentUser ? 'bg-olive-50/50' : ''}`}
                  >
                    <span className="text-lg w-7 text-center">{medal}</span>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">{m.name}</span>
                        {m.isCurrentUser && (
                          <span className="text-[9px] font-bold text-olive-600 bg-olive-100 px-1.5 py-0.5 rounded">TU</span>
                        )}
                        {i === 0 && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {m.itemsUsed} usati · {m.saved} salvati
                        {m.streak > 0 && ` · 🔥${m.streak}d`}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-800">{m.xp.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400">XP</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!hasActivity && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <Leaf className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Nessuna attività registrata ancora.</p>
          <p className="text-slate-400 text-xs mt-1">
            Usa il frigo, registra i pasti e le statistiche appariranno qui.
          </p>
        </div>
      )}

      {/* Activity summary */}
      {hasActivity && (
        <div className="bg-olive-50 rounded-2xl border border-olive-200/50 p-5">
          <h2 className="text-sm font-bold text-olive-800 mb-2 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-olive-600" />
            Riepilogo
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-olive-800">{stats.itemsAdded}</p>
              <p className="text-[10px] text-olive-600">Aggiunti</p>
            </div>
            <div>
              <p className="text-lg font-bold text-olive-800">{stats.itemsUsed}</p>
              <p className="text-[10px] text-olive-600">Usati</p>
            </div>
            <div>
              <p className="text-lg font-bold text-olive-800">{stats.mealsLogged}</p>
              <p className="text-[10px] text-olive-600">Pasti</p>
            </div>
            <div>
              <p className="text-lg font-bold text-olive-800">{stats.savedBeforeExpiry}</p>
              <p className="text-[10px] text-olive-600">Salvati in tempo</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
