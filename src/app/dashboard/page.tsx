import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Refrigerator, Plus, Zap, CheckCircle2, ChefHat, Users } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch the user's profile to get their household_id
  const { data: profile } = await supabase
    .from('users')
    .select('household_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) {
    return redirect('/setup')
  }

  // Fetch inventory for the household via RLS
  const { data: inventoryData } = await supabase
    .from('inventory_items')
    .select('*')
    .order('expiry_date', { ascending: true })

  const inventory = inventoryData || []

  return (
    <div className="flex flex-col gap-6 animate-in py-8 max-w-2xl mx-auto px-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <Refrigerator className="w-6 h-6 text-olive-600" />
            Family Fridge
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, {profile?.full_name || 'Chef'}!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/household"
            className="bg-slate-100 text-slate-600 p-3 rounded-full hover:bg-slate-200 active:scale-95 transition-all"
            title="Household members"
          >
            <Users className="w-5 h-5" />
          </a>
          <button className="bg-olive-600 text-white p-3 rounded-full shadow-lg hover:bg-olive-700 active:scale-95 transition-all">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 text-amber-600 font-semibold mb-1 text-sm">
            <Zap className="w-4 h-4" />
            Zero-Waste
          </div>
          <span className="text-3xl font-bold text-slate-800">12</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
            Items Saved
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 text-olive-600 font-semibold mb-1 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Active
          </div>
          <span className="text-3xl font-bold text-slate-800">
            {inventory.length}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
            Total Ingredients
          </span>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 mt-2">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Expiring Soon</h2>
        </div>

        {inventory.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Your fridge is empty! Click the + button to add groceries.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex justify-between items-center group"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{item.name}</h3>
                  <div className="flex gap-3 text-xs text-slate-500 mt-1 font-medium">
                    <span>{item.quantity}</span>
                    <span>&bull;</span>
                    <span className="text-amber-600 font-bold">
                      Expires:{' '}
                      {new Date(item.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button className="text-sm font-semibold text-olive-600 bg-olive-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  Use
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zero Waste CTA */}
      <button className="w-full bg-slate-900 text-white rounded-2xl py-4 font-semibold shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 mb-8">
        <ChefHat className="w-5 h-5" />
        Generate Zero-Waste Recipe
      </button>
    </div>
  )
}
