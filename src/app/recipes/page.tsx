import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ChefHat, Refrigerator } from 'lucide-react'
import RecipeGenerator from './recipe-generator'
import NavBar from '@/app/components/nav-bar'

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
          Zero-Waste Recipes
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Generate recipes based on what&apos;s in your fridge.
        </p>
      </div>

      {inventory.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
          <Refrigerator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            Nothing in the fridge yet
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Add items to your fridge first so we can suggest recipes.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-olive-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-olive-700 active:scale-95 transition-all"
          >
            Go to Dashboard
          </a>
        </div>
      ) : (
        <>
          {/* Expiring Ingredients */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                Your Ingredients
              </h2>
            </div>
            <div className="px-6 py-4 flex flex-wrap gap-2">
              {ingredients.map((item) => {
                let colorClasses: string
                if (item.daysLeft <= 1) {
                  colorClasses =
                    'bg-red-50 text-red-700 border-red-200'
                } else if (item.daysLeft <= 3) {
                  colorClasses =
                    'bg-amber-50 text-amber-700 border-amber-200'
                } else {
                  colorClasses =
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                }

                return (
                  <span
                    key={item.name}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${colorClasses}`}
                  >
                    {item.name}
                    <span className="text-xs font-bold opacity-75">
                      {item.daysLeft <= 0
                        ? 'expired'
                        : item.daysLeft === 1
                          ? '1d'
                          : `${item.daysLeft}d`}
                    </span>
                  </span>
                )
              })}
            </div>
          </div>

          {/* Recipe Generator */}
          <RecipeGenerator ingredients={ingredients} />
        </>
      )}

      <NavBar />
    </div>
  )
}
