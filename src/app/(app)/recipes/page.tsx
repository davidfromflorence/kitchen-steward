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
    daysLeft: item.expiry_date
      ? Math.ceil(
          (new Date(item.expiry_date).getTime() - Date.now()) / 86400000
        )
      : 999,
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

      {inventory.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Refrigerator className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            Your fridge is empty — the AI Chef will generate recipes from general ingredients. <a href="/fridge" className="font-semibold underline">Add items</a> for personalized suggestions.
          </p>
        </div>
      )}

      <RecipeClient ingredients={ingredients} />

    </div>
  )
}
