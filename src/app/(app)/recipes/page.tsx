import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ChefHat, Leaf, Refrigerator } from 'lucide-react'
import RecipeClient from './recipe-client'

export default async function RecipesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('household_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) {
    return redirect('/setup')
  }

  const { data: inventoryData } = await supabase
    .from('inventory_items')
    .select('*')
    .order('expiry_date', { ascending: true })

  const inventory = inventoryData || []

  const ingredients = inventory.map((item) => ({
    name: item.name as string,
    daysLeft: Math.ceil(
      (new Date(item.expiry_date).getTime() - Date.now()) / 86400000
    ),
  }))

  return (
    <div className="flex flex-col gap-6 animate-in py-8 max-w-2xl mx-auto px-6 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
          <ChefHat className="w-6 h-6 text-olive-600" />
          AI Chef
        </h1>
        <div className="flex items-center gap-1.5 mt-1">
          <Leaf className="w-3.5 h-3.5 text-olive-500" />
          <span className="text-sm font-semibold text-olive-600">
            Plant-Forward Cooking
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Generate sustainable recipes from your pantry.
        </p>
      </div>

      {inventory.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
          <Refrigerator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            Nothing in the pantry yet
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Add items to your fridge first so the AI Chef can craft recipes.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-olive-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-olive-700 active:scale-95 transition-all"
          >
            Go to Dashboard
          </a>
        </div>
      ) : (
        <RecipeClient ingredients={ingredients} />
      )}

    </div>
  )
}
