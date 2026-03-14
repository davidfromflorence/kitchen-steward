'use client'

import { useState } from 'react'
import {
  ChefHat,
  Clock,
  Loader2,
  Sparkles,
  Users,
  ShoppingBasket,
  Leaf,
  Check,
} from 'lucide-react'

interface Ingredient {
  name: string
  daysLeft: number
}

interface RecipeData {
  title: string
  emoji: string
  ingredients: string[]
  quick_steps: string[]
  prep_time_minutes: number
  servings: number
  eco_impact_kg: number
}

const COOKING_TIMES = [
  { label: '< 30 min', value: '30' },
  { label: '< 1 hour', value: '60' },
  { label: 'Any', value: 'any' },
]

const INGREDIENT_COUNTS = [
  { label: '3', value: '3' },
  { label: '5', value: '5' },
  { label: '7', value: '7' },
]

const SERVING_OPTIONS = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '4', value: '4' },
  { label: '6', value: '6' },
]

const DIET_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'High Protein',
  'Low Carb',
  'Gluten Free',
  'Mediterranean',
]

export default function RecipeClient({
  ingredients,
}: {
  ingredients: Ingredient[]
}) {
  const [cookingTime, setCookingTime] = useState('30')
  const [ingredientCount, setIngredientCount] = useState('5')
  const [servings, setServings] = useState('2')
  const [selectedDiets, setSelectedDiets] = useState<string[]>([])
  const [recipe, setRecipe] = useState<RecipeData | null>(null)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
    new Set()
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleDiet = (diet: string) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    )
  }

  const toggleIngredientCheck = (ingredient: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev)
      if (next.has(ingredient)) {
        next.delete(ingredient)
      } else {
        next.add(ingredient)
      }
      return next
    })
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setRecipe(null)
    setCheckedIngredients(new Set())

    try {
      const res = await fetch('/api/ai/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          params: {
            cookingTime,
            ingredientCount,
            servings,
            diets: selectedDiets,
          },
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to generate recipe')
      }

      const data = await res.json()
      const generated = data.recipes?.[0] || data.recipe
      if (generated) {
        setRecipe({
          title: generated.title || 'Untitled Recipe',
          emoji: generated.emoji || '',
          ingredients: generated.ingredients || [],
          quick_steps: generated.quick_steps || [],
          prep_time_minutes: generated.prep_time_minutes || 30,
          servings: parseInt(servings),
          eco_impact_kg: generated.eco_impact_kg || 0.8,
        })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Recipe Parameters */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            Recipe Parameters
          </h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Cooking Time */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Cooking Time
            </label>
            <div className="flex rounded-xl bg-slate-100 p-1">
              {COOKING_TIMES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCookingTime(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    cookingTime === opt.value
                      ? 'bg-olive-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients Count */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Ingredients
            </label>
            <div className="flex rounded-xl bg-slate-100 p-1">
              {INGREDIENT_COUNTS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIngredientCount(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    ingredientCount === opt.value
                      ? 'bg-olive-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Servings */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Servings
            </label>
            <div className="flex rounded-xl bg-slate-100 p-1">
              {SERVING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setServings(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    servings === opt.value
                      ? 'bg-olive-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Diet */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Diet
            </label>
            <div className="flex rounded-xl bg-slate-100 p-1 overflow-x-auto scrollbar-hide">
              {DIET_OPTIONS.map((diet) => {
                const isSelected = selectedDiets.includes(diet)
                return (
                  <button
                    key={diet}
                    onClick={() => toggleDiet(diet)}
                    className={`flex-shrink-0 flex-1 min-w-fit px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-olive-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {diet}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-olive-600 text-white rounded-2xl py-4 font-semibold shadow-lg hover:bg-olive-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:active:scale-100"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Recipe...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Recipe
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-5 py-4 text-center">
          {error}
        </div>
      )}

      {/* Generated Recipe */}
      {recipe && (
        <div className="flex flex-col gap-5 animate-in">
          {/* Recipe Hero Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Image Placeholder */}
            <div className="relative h-52 bg-gradient-to-br from-olive-200 via-olive-300 to-olive-400 flex items-center justify-center">
              <span className="text-6xl">{recipe.emoji || ''}</span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-bold text-white leading-tight">
                  {recipe.title}
                </h3>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-around py-4 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <ShoppingBasket className="w-4 h-4 text-olive-500" />
                <span className="font-semibold">
                  {recipe.ingredients.length} Items
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-olive-500" />
                <span className="font-semibold">
                  {recipe.prep_time_minutes} Min
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Users className="w-4 h-4 text-olive-500" />
                <span className="font-semibold">
                  {recipe.servings} Servings
                </span>
              </div>
            </div>
          </div>

          {/* Required Ingredients */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                Required Ingredients
              </h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {recipe.ingredients.map((ingredient) => {
                const isChecked = checkedIngredients.has(ingredient)
                return (
                  <li
                    key={ingredient}
                    className="flex items-center justify-between px-6 py-3.5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => toggleIngredientCheck(ingredient)}
                  >
                    <span
                      className={`text-sm font-medium transition-colors ${
                        isChecked
                          ? 'text-slate-400 line-through'
                          : 'text-slate-700'
                      }`}
                    >
                      {ingredient}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-olive-600 border-olive-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                Step-by-Step Instructions
              </h2>
            </div>
            <div className="px-6 py-5">
              <ol className="space-y-4">
                {recipe.quick_steps.map((step, index) => (
                  <li key={index} className="flex gap-4 text-sm text-slate-700">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-olive-50 text-olive-600 text-xs font-bold flex items-center justify-center border border-olive-100">
                      {index + 1}
                    </span>
                    <span className="pt-1 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Eco Impact */}
          <div className="bg-olive-50 rounded-3xl border border-olive-200 px-6 py-5 flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-olive-100 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-olive-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-olive-800 mb-0.5">
                Eco Impact
              </h3>
              <p className="text-sm text-olive-700 leading-relaxed">
                By using these ingredients today, you prevent{' '}
                <span className="font-bold">{recipe.eco_impact_kg} kg</span> of
                CO2 emissions from food waste.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
