import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ActionButtons from './action-buttons'
import XPBar from './xp-bar'
import DailyChallenge from './daily-challenge'
import {
  Refrigerator,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import ActivityFeed from './activity-feed'

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

  return (
    <div className="flex flex-col gap-5 animate-in py-6 max-w-3xl mx-auto px-4 sm:px-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-olive-50 text-olive-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <Refrigerator className="w-3 h-3" />
            {totalItems} prodotti
          </span>
          {expiringSoonItems.length > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              <AlertTriangle className="w-3 h-3" />
              {expiringSoonItems.length} in scadenza
            </span>
          )}
        </p>
      </div>

      {/* XP Bar */}
      <XPBar />

      {/* Expiring Soon — the most actionable info */}
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
              Apri frigo <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Empty state when fridge is empty */}
      {totalItems === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <Refrigerator className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Il frigo è vuoto!</p>
          <p className="text-slate-400 text-xs mt-1">Aggiungi i tuoi primi prodotti per iniziare.</p>
        </div>
      )}

      {/* Waste-free badge when everything is good */}
      {totalItems > 0 && expiringSoonItems.length === 0 && (
        <div className="bg-olive-50 rounded-2xl border border-olive-200/50 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-olive-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-olive-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-olive-800">Tutto fresco!</p>
            <p className="text-xs text-olive-600">Nessun prodotto in scadenza. {wasteFreePct}% senza sprechi.</p>
          </div>
        </div>
      )}

      {/* Daily Challenges */}
      <DailyChallenge />

      {/* Activity Feed */}
      <ActivityFeed />
    </div>
  )
}
