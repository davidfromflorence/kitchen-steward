import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Leaf,
  DollarSign,
  CloudOff,
  Clock,
  ShoppingCart,
  UtensilsCrossed,
  Milk,
  Apple,
  Salad,
} from 'lucide-react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

function daysUntilExpiry(expiryDate: string): number {
  return Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / 86_400_000
  )
}

function expiryDotColor(days: number): string {
  if (days <= 1) return 'bg-red-500'
  if (days <= 3) return 'bg-amber-400'
  return 'bg-emerald-500'
}

function expiryBadgeClasses(days: number): string {
  if (days <= 1) return 'bg-red-50 text-red-600'
  if (days <= 3) return 'bg-amber-50 text-amber-600'
  return 'bg-emerald-50 text-emerald-600'
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

  // --- Derived stats ---
  const totalItems = inventory.length
  const expiredCount = inventory.filter(
    (item) => daysUntilExpiry(item.expiry_date) < 0
  ).length
  const wasteFreePct =
    totalItems > 0
      ? Math.round(((totalItems - expiredCount) / totalItems) * 100)
      : 100

  const fillPct = Math.min(Math.round((totalItems / 30) * 100), 100)

  const expiringSoonItems = inventory
    .filter((item) => daysUntilExpiry(item.expiry_date) >= 0)
    .slice(0, 3)

  const firstName = profile.full_name?.split(' ')[0] || 'Chef'

  // --- Mock activity data ---
  const activities = [
    { icon: Milk, text: 'Mom added Oat Milk', time: '2h ago' },
    { icon: UtensilsCrossed, text: 'Sam consumed Leftover Pasta', time: '5h ago' },
    { icon: Apple, text: 'You added Granny Smith Apples', time: '8h ago' },
    { icon: ShoppingCart, text: 'Dad restocked Chicken Breast', time: '1d ago' },
    { icon: Salad, text: 'Emma used Mixed Greens for salad', time: '1d ago' },
  ]

  // --- Weekly bar chart mock data ---
  const weeklyBars = [65, 40, 80, 55, 90, 70, 45]
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="flex flex-col gap-6 animate-in py-8 max-w-4xl mx-auto px-6 pb-12">
      {/* ── Header Row ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-slate-500 mt-1">
            Your kitchen is{' '}
            <span className="font-semibold text-olive-600">
              {wasteFreePct}%
            </span>{' '}
            Waste-Free Today
          </p>
        </div>
        <Link
          href="/fridge?add=true"
          className="flex items-center gap-2 bg-olive-600 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg hover:bg-olive-700 active:scale-95 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Link>
      </div>

      {/* ── Row 1: Fridge Status + Expiring Soon ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fridge Status Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Fridge Status</h2>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE SYSTEM
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            {/* Fill Level — circular progress */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#65a30d"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${fillPct * 0.974} 100`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
                  {fillPct}%
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Fill Level
              </span>
            </div>

            {/* Temperature */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center">
                <span className="text-lg font-bold text-sky-600">3.2°</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Internal Temp
              </span>
            </div>

            {/* Humidity */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center">
                <span className="text-lg font-bold text-violet-600">42%</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Humidity Level
              </span>
            </div>
          </div>
        </div>

        {/* Expiring Soon Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Expiring Soon</h2>
            <Link
              href="/fridge"
              className="text-sm font-semibold text-olive-600 hover:underline"
            >
              View All
            </Link>
          </div>

          {expiringSoonItems.length === 0 ? (
            <p className="text-slate-400 text-sm py-6 text-center">
              No items expiring soon. Nice work!
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {expiringSoonItems.map((item) => {
                const days = daysUntilExpiry(item.expiry_date)
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${expiryDotColor(days)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-800 truncate block">
                        {item.name}
                      </span>
                      {item.quantity && (
                        <span className="text-xs text-slate-400">
                          ({item.quantity}
                          {item.unit ? ` ${item.unit}` : ''})
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${expiryBadgeClasses(days)}`}
                    >
                      {days === 0
                        ? 'Today'
                        : days === 1
                          ? 'Expires in 1d'
                          : `Expires in ${days}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Eco Impact + Activity ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Eco Impact Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Eco Impact</h2>

          {/* Weekly Waste Saved bar chart */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Weekly Waste Saved
            </p>
            <div className="flex items-end gap-2 h-24">
              {weeklyBars.map((height, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-t-md bg-olive-500/80"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-slate-400 font-medium">
                    {weekDays[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Leaf className="w-3.5 h-3.5 text-olive-600" />
              </div>
              <p className="text-lg font-bold text-slate-800">12.4 kg</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Items Saved
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CloudOff className="w-3.5 h-3.5 text-sky-500" />
              </div>
              <p className="text-lg font-bold text-slate-800">45.8 kg</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                CO2 Saved
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-lg font-bold text-slate-800">$142.50</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Money Saved
              </p>
            </div>
          </div>
        </div>

        {/* Activity Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Activity</h2>

          <div className="flex flex-col divide-y divide-slate-100">
            {activities.map((activity, i) => {
              const Icon = activity.icon
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-full bg-olive-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-olive-600" />
                  </div>
                  <p className="flex-1 text-sm text-slate-700">{activity.text}</p>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              )
            })}
          </div>

          <Link
            href="/fridge"
            className="flex items-center justify-center gap-1 text-sm font-semibold text-olive-600 hover:underline mt-4 pt-3 border-t border-slate-100"
          >
            <Clock className="w-3.5 h-3.5" />
            View Full History
          </Link>
        </div>
      </div>
    </div>
  )
}
