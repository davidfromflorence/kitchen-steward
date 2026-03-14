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
  { label: '10 min', value: '10' },
  { label: '20 min', value: '20' },
  { label: '30 min', value: '30' },
  { label: '45 min', value: '45' },
  { label: '1 hr', value: '60' },
  { label: '1.5 hr', value: '90' },
  { label: '2 hr', value: '120' },
  { label: 'Any', value: 'any' },
]

const INGREDIENT_COUNTS = [
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '10', value: '10' },
]

const SERVING_OPTIONS = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '8', value: '8' },
  { label: '10', value: '10' },
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
        <div className="px-6 py-5 flex flex-col gap-6">
          {/* Cooking Time — slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Cooking Time
              </label>
              <span className="text-sm font-semibold text-olive-700">
                {COOKING_TIMES.find((o) => o.value === cookingTime)?.label}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={0}
                max={COOKING_TIMES.length - 1}
                value={COOKING_TIMES.findIndex((o) => o.value === cookingTime)}
                onChange={(e) => setCookingTime(COOKING_TIMES[Number(e.target.value)].value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-olive-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-olive-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-400 font-medium">{COOKING_TIMES[0].label}</span>
                <span className="text-[10px] text-slate-400 font-medium">{COOKING_TIMES[Math.floor(COOKING_TIMES.length / 2)].label}</span>
                <span className="text-[10px] text-slate-400 font-medium">{COOKING_TIMES[COOKING_TIMES.length - 1].label}</span>
              </div>
            </div>
          </div>

          {/* Ingredients — slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Ingredients
              </label>
              <span className="text-sm font-semibold text-olive-700">
                {ingredientCount} items
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={0}
                max={INGREDIENT_COUNTS.length - 1}
                value={INGREDIENT_COUNTS.findIndex((o) => o.value === ingredientCount)}
                onChange={(e) => setIngredientCount(INGREDIENT_COUNTS[Number(e.target.value)].value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-olive-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-olive-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-400 font-medium">{INGREDIENT_COUNTS[0].label}</span>
                <span className="text-[10px] text-slate-400 font-medium">{INGREDIENT_COUNTS[Math.floor(INGREDIENT_COUNTS.length / 2)].label}</span>
                <span className="text-[10px] text-slate-400 font-medium">{INGREDIENT_COUNTS[INGREDIENT_COUNTS.length - 1].label}</span>
              </div>
            </div>
          </div>

          {/* Servings — slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Servings
              </label>
              <span className="text-sm font-semibold text-olive-700">
                {servings}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={0}
                max={SERVING_OPTIONS.length - 1}
                value={SERVING_OPTIONS.findIndex((o) => o.value === servings)}
                onChange={(e) => setServings(SERVING_OPTIONS[Number(e.target.value)].value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-olive-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-olive-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-400 font-medium">{SERVING_OPTIONS[0].label}</span>
                <span className="text-[10px] text-slate-400 font-medium">{SERVING_OPTIONS[Math.floor(SERVING_OPTIONS.length / 2)].label}</span>
                <span className="text-[10px] text-slate-400 font-medium">{SERVING_OPTIONS[SERVING_OPTIONS.length - 1].label}</span>
              </div>
            </div>
          </div>

          {/* Diet — toggle chips */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Diet
            </label>
            <div className="flex flex-wrap gap-2">
              {DIET_OPTIONS.map((diet) => {
                const isSelected = selectedDiets.includes(diet)
                return (
                  <button
                    key={diet}
                    onClick={() => toggleDiet(diet)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-olive-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
