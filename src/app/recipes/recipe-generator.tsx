'use client'

import { useState } from 'react'
import { ChefHat, Clock, Loader2, Sparkles } from 'lucide-react'

interface Ingredient {
  name: string
  daysLeft: number
}

interface Recipe {
  title: string
  quick_steps: string[]
  prep_time_minutes: number
  zero_waste_reason: string
}

export default function RecipeGenerator({
  ingredients,
}: {
  ingredients: Ingredient[]
}) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setRecipes([])

    try {
      const res = await fetch('/api/ai/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      })

      if (!res.ok) {
        throw new Error('Failed to generate recipes')
      }

      const data = await res.json()
      setRecipes(data.recipes || [])
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-olive-600 text-white rounded-2xl py-4 font-semibold shadow-lg hover:bg-olive-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:active:scale-100"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Recipes...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Recipes
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-5 py-4 text-center">
          {error}
        </div>
      )}

      {/* Recipe Cards */}
      {recipes.map((recipe, index) => (
        <div
          key={index}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-olive-600" />
              <h3 className="text-lg font-bold text-slate-800">
                {recipe.title}
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {recipe.prep_time_minutes} min
            </span>
          </div>

          <div className="px-6 py-5">
            {/* Steps */}
            <ol className="space-y-2 mb-4">
              {recipe.quick_steps.map((step, stepIndex) => (
                <li
                  key={stepIndex}
                  className="flex gap-3 text-sm text-slate-700"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-olive-50 text-olive-600 text-xs font-bold flex items-center justify-center">
                    {stepIndex + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>

            {/* Zero-waste reason */}
            <p className="text-sm italic text-slate-500 border-t border-slate-100 pt-4">
              {recipe.zero_waste_reason}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
