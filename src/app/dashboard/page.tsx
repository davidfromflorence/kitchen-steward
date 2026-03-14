import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Refrigerator, Zap, CheckCircle2 } from 'lucide-react'
import NavBar from '@/app/components/nav-bar'
import DashboardActions from './dashboard-client'
import InventoryList from './inventory-list'

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
    .order('expiry_date', { ascending: true })

  const inventory = inventoryData || []

  // Count items expiring within 3 days
  const expiringSoon = inventory.filter((item) => {
    const days = Math.ceil(
      (new Date(item.expiry_date).getTime() - Date.now()) / 86400000
    )
    return days <= 3 && days >= 0
  }).length

  return (
    <div className="flex flex-col gap-6 animate-in py-8 max-w-2xl mx-auto px-6 pb-28">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <Refrigerator className="w-6 h-6 text-olive-600" />
            Family Fridge
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, {profile.full_name || 'Chef'}!
          </p>
        </div>
        <DashboardActions />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 text-amber-600 font-semibold mb-1 text-sm">
            <Zap className="w-4 h-4" />
            Expiring Soon
          </div>
          <span className="text-3xl font-bold text-slate-800">
            {expiringSoon}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
            Within 3 days
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
            Total Items
          </span>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Your Inventory</h2>
        </div>
        <InventoryList items={inventory} />
      </div>

      {/* Zero Waste CTA */}
      <a
        href="/recipes"
        className="w-full bg-slate-900 text-white rounded-2xl py-4 font-semibold shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        Generate Zero-Waste Recipe
      </a>

      <NavBar />
    </div>
  )
}
