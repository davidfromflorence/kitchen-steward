import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ActionButtons from './action-buttons'
import XPBar from './xp-bar'
import DailyChallenge from './daily-challenge'
import {
  Leaf,
  DollarSign,
  CloudOff,
  Refrigerator,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buongiorno'
  if (hour < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}

function daysUntilExpiry(expiryDate: string | null): number {
  if (!expiryDate) return 999
  return Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / 86_400_000
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('household_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) return redirect('/setup')

  const { data: inventoryData } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('household_id', profile.household_id)
    .order('expiry_date', { ascending: true })

  const inventory = inventoryData || []

  const totalItems = inventory.length
  const expiredCount = inventory.filter(
    (item) => daysUntilExpiry(item.expiry_date) < 0
  ).length
  const wasteFreePct =
    totalItems > 0
      ? Math.round(((totalItems - expiredCount) / totalItems) * 100)
      : 100

  const expiringSoonItems = inventory
    .filter((item) => {
      const days = daysUntilExpiry(item.expiry_date)
      return days >= 0 && days <= 5
    })
    .slice(0, 5)

  const firstName = profile.full_name?.split(' ')[0] || 'Chef'

  // Category breakdown for fridge overview
  const categoriesMap: Record<string, number> = {}
  for (const item of inventory) {
    const cat = item.category || 'General'
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1
  }
  const categoriesSorted = Object.entries(categoriesMap).sort((a, b) => b[1] - a[1])

  const categoryEmojis: Record<string, string> = {
    Protein: '🥩',
    Vegetable: '🥬',
    Fruit: '🍎',
    Dairy: '🧀',
    Carbohydrate: '🍞',
    Condiment: '🧂',
    General: '📦',
  }

  return (
    <div className="flex flex-col gap-5 animate-in py-6 max-w-3xl mx-auto px-4 sm:px-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Il tuo frigo è{' '}
            <span className="font-semibold text-olive-600">
              {wasteFreePct}%
            </span>{' '}
            senza sprechi
          </p>
        </div>
        <ActionButtons />
      </div>

      {/* XP Bar */}
      <XPBar />

      {/* Quick Stats Row — full width, 3 stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-olive-50 flex items-center justify-center mx-auto mb-2">
            <Refrigerator className="w-5 h-5 text-olive-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
          <p className="text-xs text-slate-400 font-medium">Prodotti</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{expiringSoonItems.length}</p>
          <p className="text-xs text-slate-400 font-medium">In scadenza</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{wasteFreePct}%</p>
          <p className="text-xs text-slate-400 font-medium">Zero spreco</p>
        </div>
      </div>

      {/* Daily Challenges — full width, prominent */}
      <DailyChallenge />

      {/* Expiring Soon — full width */}
      {expiringSoonItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              In scadenza
            </h2>
            <Link
              href="/fridge"
              className="text-sm font-semibold text-olive-600 hover:underline flex items-center gap-1"
            >
              Vedi tutto <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {expiringSoonItems.map((item) => {
              const days = daysUntilExpiry(item.expiry_date)
              const dotColor = days <= 1 ? 'bg-red-500' : days <= 3 ? 'bg-amber-400' : 'bg-emerald-500'
              const badgeColor = days <= 1 ? 'bg-red-50 text-red-600 border-red-200' : days <= 3 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
              return (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeColor}`}>
                    {days === 0 ? 'Oggi!' : days === 1 ? 'Domani' : `${days} giorni`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Fridge Overview — full width category breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Refrigerator className="w-4 h-4 text-olive-600" />
            Il tuo frigo
          </h2>
          <Link
            href="/fridge"
            className="text-sm font-semibold text-olive-600 hover:underline flex items-center gap-1"
          >
            Apri <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {totalItems === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-slate-400 text-sm">Il frigo è vuoto. Aggiungi qualcosa!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-100">
            {categoriesSorted.map(([cat, count]) => (
                <div key={cat} className="bg-white px-4 py-3 flex items-center gap-3">
                  <span className="text-xl">{categoryEmojis[cat] || '📦'}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{count}</p>
                    <p className="text-xs text-slate-400">{cat}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Eco Impact — full width, 3 columns */}
      <div className="bg-gradient-to-br from-olive-50 to-emerald-50 rounded-2xl border border-olive-200/50 p-5">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Leaf className="w-4 h-4 text-olive-600" />
          Il tuo impatto
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center mx-auto mb-2">
              <Leaf className="w-5 h-5 text-olive-600" />
            </div>
            <p className="text-lg font-bold text-slate-800">
              {(totalItems * 0.3).toFixed(1)} kg
            </p>
            <p className="text-xs text-slate-500">Cibo salvato</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center mx-auto mb-2">
              <CloudOff className="w-5 h-5 text-sky-500" />
            </div>
            <p className="text-lg font-bold text-slate-800">
              {(totalItems * 0.8).toFixed(1)} kg
            </p>
            <p className="text-xs text-slate-500">CO₂ risparmiata</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-slate-800">
              €{(totalItems * 2.5).toFixed(0)}
            </p>
            <p className="text-xs text-slate-500">Risparmiati</p>
          </div>
        </div>
      </div>
    </div>
  )
}
