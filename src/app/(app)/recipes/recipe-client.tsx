'use client'

import { useState } from 'react'
import { useGamification } from '@/app/(app)/gamification-context'
import { logMeal } from '@/app/actions/inventory'
import {
  ChefHat,
  Clock,
  Loader2,
  Sparkles,
  Users,
  ShoppingBasket,
  Leaf,
  Check,
  ArrowLeft,
  RotateCcw,
  Flame,
  ExternalLink,
  CookingPot,
} from 'lucide-react'

interface Ingredient {
  name: string
  daysLeft: number
}

interface UsefulLink {
  label: string
  url: string
}

interface RecipeData {
  title: string
  emoji: string
  description: string
  ingredients: string[]
  quick_steps: string[]
  prep_time_minutes: number
  difficulty: string
  eco_impact_kg: number
  zero_waste_reason: string
  useful_links?: UsefulLink[]
}

const COOKING_TIMES = [
  { label: '10 min', value: '10' },
  { label: '20 min', value: '20' },
  { label: '30 min', value: '30' },
  { label: '45 min', value: '45' },
  { label: '1 ora', value: '60' },
  { label: '1.5 ore', value: '90' },
  { label: '2 ore', value: '120' },
  { label: 'Qualsiasi', value: 'any' },
]

const INGREDIENT_COUNTS = [
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '8', value: '8' },
  { label: '10', value: '10' },
]

const SERVING_OPTIONS = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '6', value: '6' },
  { label: '8', value: '8' },
]

const DIET_OPTIONS = [
  'Vegetariano',
  'Vegano',
  'Alto Proteico',
  'Low Carb',
  'Senza Glutine',
  'Mediterraneo',
]

const DIFFICULTY_COLORS: Record<string, string> = {
  'Facile': 'bg-emerald-100 text-emerald-700',
  'Media': 'bg-amber-100 text-amber-700',
  'Avanzata': 'bg-red-100 text-red-700',
}

const RECIPE_GRADIENTS = [
  'from-olive-300 to-emerald-500',
  'from-amber-300 to-orange-500',
  'from-sky-300 to-blue-500',
]

export default function RecipeClient({ ingredients }: { ingredients: Ingredient[] }) {
  const { awardXP } = useGamification()
  const [cookingTime, setCookingTime] = useState('30')
  const [ingredientCount, setIngredientCount] = useState('5')
  const [servings, setServings] = useState('2')
  const [selectedDiets, setSelectedDiets] = useState<string[]>([])
  const [recipes, setRecipes] = useState<RecipeData[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeData | null>(null)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [cooking, setCooking] = useState(false)
  const [cookResult, setCookResult] = useState<{ used: Array<{ name: string; subtracted: number; unit: string; removed: boolean }> } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleDiet = (diet: string) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    )
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setRecipes([])
    setSelectedRecipe(null)
    setCheckedIngredients(new Set())

    try {
      const res = await fetch('/api/ai/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          params: { cookingTime, ingredientCount, servings, diets: selectedDiets },
        }),
      })

      if (!res.ok) throw new Error('Failed')

      const data = await res.json()
      const generated = data.recipes || []
      if (generated.length > 0) {
        setRecipes(generated)
        awardXP('recipe_generated', 15)
      } else {
        setError('Nessuna ricetta generata. Riprova!')
      }
    } catch {
      setError('Qualcosa è andato storto. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  const selectRecipe = (recipe: RecipeData) => {
    setSelectedRecipe(recipe)
    setCheckedIngredients(new Set())
    setCookResult(null)
  }

  const handleCooked = async () => {
    if (!selectedRecipe) return
    setCooking(true)
    setCookResult(null)
    try {
      const result = await logMeal(selectedRecipe.title)
      if (result.error) {
        setError(result.error)
      } else {
        setCookResult({ used: result.used })
        awardXP('recipe_cooked', 25)
      }
    } catch {
      setError('Errore nell\'aggiornamento del frigo.')
    } finally {
      setCooking(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Show full recipe detail */}
      {selectedRecipe ? (
        <div className="flex flex-col gap-4 animate-in">
          {/* Back button */}
          <button
            onClick={() => setSelectedRecipe(null)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive-600 hover:text-olive-700 self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alle proposte
          </button>

          {/* Recipe Hero */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="relative h-44 bg-gradient-to-br from-olive-200 via-olive-300 to-olive-400 flex items-center justify-center">
              <span className="text-6xl">{selectedRecipe.emoji}</span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-xl font-bold text-white leading-tight">{selectedRecipe.title}</h3>
              </div>
            </div>
            <div className="flex items-center justify-around py-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-olive-500" />
                <span className="font-semibold">{selectedRecipe.prep_time_minutes} min</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Users className="w-4 h-4 text-olive-500" />
                <span className="font-semibold">{servings} porzioni</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <ShoppingBasket className="w-4 h-4 text-olive-500" />
                <span className="font-semibold">{selectedRecipe.ingredients.length} ingr.</span>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">Ingredienti</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {selectedRecipe.ingredients.map((ingredient) => {
                const isChecked = checkedIngredients.has(ingredient)
                return (
                  <li
                    key={ingredient}
                    className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => {
                      const next = new Set(checkedIngredients)
                      isChecked ? next.delete(ingredient) : next.add(ingredient)
                      setCheckedIngredients(next)
                    }}
                  >
                    <span className={`text-sm font-medium transition-colors ${isChecked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {ingredient}
                    </span>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-olive-600 border-olive-600' : 'border-slate-300'}`}>
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">Preparazione</h2>
            </div>
            <div className="px-5 py-4">
              <ol className="space-y-3">
                {selectedRecipe.quick_steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-olive-50 text-olive-600 text-xs font-bold flex items-center justify-center border border-olive-100">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Useful links */}
          {selectedRecipe.useful_links && selectedRecipe.useful_links.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-800">Link utili</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {selectedRecipe.useful_links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-olive-700">{link.label}</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Eco impact */}
          <div className="bg-olive-50 rounded-2xl border border-olive-200 px-5 py-4 flex items-start gap-3">
            <Leaf className="w-5 h-5 text-olive-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-olive-800 mb-0.5">Anti-spreco</p>
              <p className="text-sm text-olive-700">{selectedRecipe.zero_waste_reason}</p>
            </div>
          </div>

          {/* Cook button + result */}
          {cookResult ? (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 px-5 py-4">
              <p className="text-sm font-bold text-emerald-800 mb-2">Buon appetito! Frigo aggiornato:</p>
              <ul className="space-y-1">
                {cookResult.used.map((item, i) => (
                  <li key={i} className="text-sm text-emerald-700">
                    {item.removed
                      ? `${item.name} — rimosso completamente`
                      : `${item.name} — usato ${item.subtracted} ${item.unit}`}
                  </li>
                ))}
              </ul>
              {cookResult.used.length === 0 && (
                <p className="text-sm text-emerald-600">Nessun ingrediente del frigo è stato usato.</p>
              )}
            </div>
          ) : (
            <button
              onClick={handleCooked}
              disabled={cooking}
              className="w-full bg-olive-600 text-white rounded-2xl py-4 font-semibold shadow-lg hover:bg-olive-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {cooking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Aggiorno il frigo...
                </>
              ) : (
                <>
                  <CookingPot className="w-5 h-5" />
                  Ho cucinato questa!
                </>
              )}
            </button>
          )}
        </div>
      ) : recipes.length > 0 ? (
        /* Recipe selection — 3 cards */
        <div className="flex flex-col gap-4 animate-in">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-olive-600" />
              Scegli una ricetta
            </h2>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive-600 hover:text-olive-700"
            >
              <RotateCcw className="w-4 h-4" />
              Nuove proposte
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {recipes.map((recipe, i) => (
              <button
                key={i}
                onClick={() => selectRecipe(recipe)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left hover:shadow-md hover:border-olive-300 transition-all active:scale-[0.98]"
              >
                <div className={`h-24 bg-gradient-to-br ${RECIPE_GRADIENTS[i % 3]} flex items-center justify-between px-5`}>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white leading-tight">{recipe.emoji} {recipe.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-600 mb-3">{recipe.description}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Clock className="w-3.5 h-3.5" /> {recipe.prep_time_minutes} min
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                      <ShoppingBasket className="w-3.5 h-3.5" /> {recipe.ingredients?.length || '?'} ingr.
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[recipe.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                      {recipe.difficulty || 'Media'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-olive-600">
                      <Leaf className="w-3.5 h-3.5" /> {recipe.zero_waste_reason}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Parameters + Generate */
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Flame className="w-4 h-4 text-olive-600" />
              <h2 className="text-base font-bold text-slate-800">Cosa vuoi cucinare?</h2>
            </div>
            <div className="px-5 py-5 flex flex-col gap-5">
              {/* Cooking Time */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tempo</label>
                  <span className="text-sm font-semibold text-olive-700">
                    {COOKING_TIMES.find((o) => o.value === cookingTime)?.label}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={COOKING_TIMES.length - 1}
                  value={COOKING_TIMES.findIndex((o) => o.value === cookingTime)}
                  onChange={(e) => setCookingTime(COOKING_TIMES[Number(e.target.value)].value)}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-olive-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-olive-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                />
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ingredienti</label>
                  <span className="text-sm font-semibold text-olive-700">{ingredientCount}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={INGREDIENT_COUNTS.length - 1}
                  value={INGREDIENT_COUNTS.findIndex((o) => o.value === ingredientCount)}
                  onChange={(e) => setIngredientCount(INGREDIENT_COUNTS[Number(e.target.value)].value)}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-olive-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-olive-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                />
              </div>

              {/* Servings */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Porzioni</label>
                  <span className="text-sm font-semibold text-olive-700">{servings}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={SERVING_OPTIONS.length - 1}
                  value={SERVING_OPTIONS.findIndex((o) => o.value === servings)}
                  onChange={(e) => setServings(SERVING_OPTIONS[Number(e.target.value)].value)}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-olive-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-olive-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                />
              </div>

              {/* Diet */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dieta</label>
                <div className="flex flex-wrap gap-2">
                  {DIET_OPTIONS.map((diet) => (
                    <button
                      key={diet}
                      onClick={() => toggleDiet(diet)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
                        selectedDiets.includes(diet)
                          ? 'bg-olive-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-olive-600 text-white rounded-2xl py-4 font-semibold shadow-lg hover:bg-olive-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Genero 3 ricette...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Genera ricette
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-5 py-4 text-center">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  )
}
