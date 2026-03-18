'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  Plus,
  Trash2,
  Minus,
  LayoutGrid,
  Home,
  Refrigerator,
  Snowflake,
  Archive,
  GripVertical,
  UtensilsCrossed,
  Loader2,
  Check,
  X,
  Repeat,
  Pause,
} from 'lucide-react'
import { deleteItem, useItem, moveItem, logMeal } from '@/app/actions/inventory'
import { createHabitFromDescription, saveHabit, getHabits, deleteHabit } from '@/app/actions/habits'
import type { HabitItem, Habit } from '@/app/actions/habits'
import AddItemModal from './add-item-modal'

interface InventoryItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  zone: string
  expiry_date: string
}

const CATEGORY_TABS = [
  { label: 'Tutti', value: 'All' },
  { label: '🥬 Verdura', value: 'Produce' },
  { label: '🧀 Latticini', value: 'Dairy & Eggs' },
  { label: '🥩 Proteine', value: 'Proteins' },
  { label: '🫙 Dispensa', value: 'Pantry' },
  { label: '🧊 Surgelati', value: 'Frozen' },
] as const

function mapCategory(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower === 'vegetable' || lower === 'fruit') return 'Produce'
  if (lower === 'dairy') return 'Dairy & Eggs'
  if (lower === 'protein') return 'Proteins'
  if (lower === 'carbohydrate' || lower === 'condiment') return 'Pantry'
  if (lower === 'frozen') return 'Frozen'
  return 'Other'
}

function categoryGradient(raw: string): string {
  const mapped = mapCategory(raw)
  switch (mapped) {
    case 'Produce': return 'from-emerald-300 to-green-500'
    case 'Dairy & Eggs': return 'from-sky-200 to-blue-400'
    case 'Proteins': return 'from-amber-300 to-orange-500'
    case 'Pantry': return 'from-yellow-200 to-amber-400'
    case 'Frozen': return 'from-cyan-200 to-sky-400'
    default: return 'from-slate-200 to-slate-400'
  }
}

function categoryEmoji(raw: string): string {
  const mapped = mapCategory(raw)
  switch (mapped) {
    case 'Produce': return '🥬'
    case 'Dairy & Eggs': return '🥛'
    case 'Proteins': return '🥩'
    case 'Pantry': return '🫙'
    case 'Frozen': return '🧊'
    default: return '🍽️'
  }
}

function daysUntilExpiry(expiryDate: string): number {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000)
}

function expiryBadge(expiryDate: string) {
  const days = daysUntilExpiry(expiryDate)
  const dateStr = new Date(expiryDate).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  })

  if (days <= 0) return { label: 'Scaduto', className: 'bg-red-100 text-red-700' }
  if (days <= 2) return { label: `Scade ${dateStr}`, className: 'bg-red-100 text-red-700' }
  if (days <= 5) return { label: `Scade ${dateStr}`, className: 'bg-amber-100 text-amber-700' }
  return { label: `Scade ${dateStr}`, className: 'bg-slate-100 text-slate-600' }
}

/* Kitchen View */
type KitchenZone = 'Fridge' | 'Freezer' | 'Pantry'

function mapToZone(item: InventoryItem): KitchenZone {
  const z = (item.zone || '').toLowerCase()
  if (z === 'freezer') return 'Freezer'
  if (z === 'pantry') return 'Pantry'
  if (z === 'fridge') return 'Fridge'
  // Fallback: derive from category for items without zone field
  const lower = item.category.toLowerCase()
  if (lower === 'frozen') return 'Freezer'
  if (['dairy', 'protein', 'vegetable', 'fruit'].includes(lower)) return 'Fridge'
  return 'Pantry'
}

const ZONE_CONFIG: Record<KitchenZone, {
  icon: typeof Refrigerator
  headerBg: string
  headerText: string
  borderColor: string
  bodyBg: string
}> = {
  Fridge: { icon: Refrigerator, headerBg: 'bg-sky-100', headerText: 'text-sky-800', borderColor: 'border-sky-200', bodyBg: 'bg-sky-50/30' },
  Freezer: { icon: Snowflake, headerBg: 'bg-cyan-100', headerText: 'text-cyan-800', borderColor: 'border-cyan-200', bodyBg: 'bg-cyan-50/30' },
  Pantry: { icon: Archive, headerBg: 'bg-amber-100', headerText: 'text-amber-800', borderColor: 'border-amber-200', bodyBg: 'bg-amber-50/30' },
}

const ZONE_ORDER: KitchenZone[] = ['Fridge', 'Freezer', 'Pantry']

export default function FridgeClient({ items }: { items: InventoryItem[] }) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kitchen'>('list')
  const [dragItemId, setDragItemId] = useState<string | null>(null)
  const [dragOverZone, setDragOverZone] = useState<KitchenZone | null>(null)
  const touchStartRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const [moveModalItem, setMoveModalItem] = useState<InventoryItem | null>(null)
  const [mealInput, setMealInput] = useState('')
  const [mealLoading, setMealLoading] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const [mealResult, setMealResult] = useState<{ used: Array<{ name: string; subtracted: number; unit: string; removed: boolean }>; error?: string } | null>(null)
  // Habits
  const [showHabitModal, setShowHabitModal] = useState(false)
  const [habitInput, setHabitInput] = useState('')
  const [habitLoading, setHabitLoading] = useState(false)
  const [habitStep, setHabitStep] = useState<'input' | 'confirm' | 'list'>('input')
  const [habitDraft, setHabitDraft] = useState<{ description: string; items: HabitItem[]; frequency: string; times: number } | null>(null)
  const [habitList, setHabitList] = useState<Habit[]>([])
  const [habitError, setHabitError] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('add') === 'true') setShowAddModal(true)
    if (searchParams.get('habit') === 'true') openHabitModal()
  }, [searchParams])

  const freshCount = items.filter((i) => !i.expiry_date || daysUntilExpiry(i.expiry_date) > 0).length

  const filtered = items.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    if (viewMode === 'list' && activeTab !== 'All' && mapCategory(item.category) !== activeTab) return false
    return true
  })

  const groupedByZone: Record<KitchenZone, InventoryItem[]> = { Fridge: [], Freezer: [], Pantry: [] }
  if (viewMode === 'kitchen') {
    for (const item of filtered) groupedByZone[mapToZone(item)].push(item)
  }

  async function handleLogMeal() {
    if (!mealInput.trim() || mealLoading) return
    setMealLoading(true)
    setMealResult(null)
    try {
      const result = await logMeal(mealInput.trim())
      setMealResult(result)
      if (result.success) setMealInput('')
    } catch {
      setMealResult({ error: 'Errore. Riprova.', used: [] })
    } finally {
      setMealLoading(false)
    }
  }

  async function openHabitModal() {
    setShowHabitModal(true)
    setHabitStep('input')
    setHabitDraft(null)
    setHabitError(null)
    setHabitInput('')
    // Load existing habits
    try {
      const habits = await getHabits()
      setHabitList(habits)
    } catch { /* ignore */ }
  }

  async function handleAnalyzeHabit() {
    if (!habitInput.trim() || habitLoading) return
    setHabitLoading(true)
    setHabitError(null)
    try {
      const result = await createHabitFromDescription(habitInput.trim())
      if (result.error) {
        setHabitError(result.error)
      } else if (result.habit) {
        setHabitDraft({
          description: result.habit.description,
          items: result.habit.items,
          frequency: result.habit.suggestedFrequency,
          times: result.habit.suggestedTimes,
        })
        setHabitStep('confirm')
      }
    } catch {
      setHabitError('Errore. Riprova.')
    } finally {
      setHabitLoading(false)
    }
  }

  async function handleSaveHabit() {
    if (!habitDraft || habitLoading) return
    setHabitLoading(true)
    try {
      const result = await saveHabit(habitDraft.description, habitDraft.items, habitDraft.frequency, habitDraft.times)
      if (result.error) {
        setHabitError(result.error)
      } else {
        setHabitStep('input')
        setHabitDraft(null)
        setHabitInput('')
        const habits = await getHabits()
        setHabitList(habits)
      }
    } catch {
      setHabitError('Errore nel salvataggio.')
    } finally {
      setHabitLoading(false)
    }
  }

  async function handleDeleteHabit(id: string) {
    await deleteHabit(id)
    setHabitList(prev => prev.filter(h => h.id !== id))
  }

  async function handleAction(formData: FormData, action: typeof deleteItem | typeof useItem) {
    const id = formData.get('id') as string
    setPendingId(id)
    try { await action(formData) } finally { setPendingId(null) }
  }

  // Drag and drop handlers
  function handleDragStart(e: React.DragEvent, itemId: string) {
    setDragItemId(itemId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', itemId)
  }

  function handleDragOver(e: React.DragEvent, zone: KitchenZone) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverZone(zone)
  }

  function handleDragLeave() {
    setDragOverZone(null)
  }

  async function handleDrop(e: React.DragEvent, zone: KitchenZone) {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('text/plain')
    setDragItemId(null)
    setDragOverZone(null)
    if (!itemId) return

    const item = items.find(i => i.id === itemId)
    if (!item || mapToZone(item) === zone) return

    setPendingId(itemId)
    try { await moveItem(itemId, zone) } finally { setPendingId(null) }
  }

  // Mobile: long press to move
  async function handleMoveToZone(item: InventoryItem, zone: KitchenZone) {
    setMoveModalItem(null)
    if (mapToZone(item) === zone) return
    setPendingId(item.id)
    try { await moveItem(item.id, zone) } finally { setPendingId(null) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Il mio frigo</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            <span className="font-semibold text-olive-600">{freshCount}</span> ingredienti freschi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-olive-500 w-full sm:w-44"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 bg-olive-600 hover:bg-olive-700 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Aggiungi
          </button>
          <button
            onClick={openHabitModal}
            className="inline-flex items-center gap-1.5 bg-violet-500 hover:bg-violet-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0 active:scale-95"
          >
            <Repeat className="w-4 h-4" />
            Abitudine
          </button>
          <button
            onClick={() => setShowMealModal(true)}
            className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0 active:scale-95"
          >
            <UtensilsCrossed className="w-4 h-4" />
            Mangiato
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('list')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            viewMode === 'list' ? 'bg-olive-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Lista
        </button>
        <button
          onClick={() => setViewMode('kitchen')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            viewMode === 'kitchen' ? 'bg-olive-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          Cucina
        </button>
      </div>

      {/* Category tabs — list view only */}
      {viewMode === 'list' && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.value ? 'bg-olive-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400">
                {search || activeTab !== 'All' ? 'Nessun risultato.' : 'Il frigo è vuoto! Aggiungi qualcosa.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((item) => {
                const isPending = pendingId === item.id
                const badge = item.expiry_date ? expiryBadge(item.expiry_date) : null

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${
                      isPending ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <div className={`h-24 bg-gradient-to-br ${categoryGradient(item.category)} flex items-center justify-center relative`}>
                      <span className="text-3xl">{categoryEmoji(item.category)}</span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-slate-800 text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{item.quantity} {item.unit}</p>
                      {badge && (
                        <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}
                      {/* Always-visible action buttons */}
                      <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                        <form action={(fd) => handleAction(fd, useItem)} className="flex-1">
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            disabled={isPending}
                            className="w-full inline-flex items-center justify-center gap-1 text-xs font-medium text-olive-700 bg-olive-50 hover:bg-olive-100 rounded-lg py-1.5 transition-colors"
                          >
                            <Minus className="w-3 h-3" /> Usa
                          </button>
                        </form>
                        <form action={(fd) => handleAction(fd, deleteItem)} className="flex-1">
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            disabled={isPending}
                            className="w-full inline-flex items-center justify-center gap-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg py-1.5 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Elimina
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Kitchen View with drag & drop */}
      {viewMode === 'kitchen' && (
        <>
          <p className="text-xs text-slate-400 mb-3">
            Trascina un prodotto da una zona all&apos;altra, oppure tieni premuto per spostarlo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ZONE_ORDER.map((zone) => {
              const config = ZONE_CONFIG[zone]
              const ZoneIcon = config.icon
              const zoneItems = groupedByZone[zone]
              const isOver = dragOverZone === zone

              return (
                <div
                  key={zone}
                  className={`bg-white rounded-2xl border-2 ${isOver ? 'border-olive-400 bg-olive-50/30 scale-[1.02]' : config.borderColor} shadow-sm overflow-hidden transition-all`}
                  onDragOver={(e) => handleDragOver(e, zone)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, zone)}
                >
                  <div className={`${config.headerBg} px-4 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <ZoneIcon className={`w-4 h-4 ${config.headerText}`} />
                      <h2 className={`text-sm font-bold ${config.headerText}`}>{zone}</h2>
                    </div>
                    <span className={`text-xs font-semibold ${config.headerText} bg-white/60 px-2 py-0.5 rounded-full`}>
                      {zoneItems.length}
                    </span>
                  </div>

                  <div className={`p-3 min-h-[150px] ${config.bodyBg}`}>
                    {zoneItems.length === 0 ? (
                      <div className="flex items-center justify-center h-full min-h-[120px]">
                        <p className="text-slate-300 text-sm italic">Vuoto — trascina qui!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {zoneItems.map((item) => {
                          const isPending = pendingId === item.id
                          const isDragging = dragItemId === item.id
                          const days = item.expiry_date ? daysUntilExpiry(item.expiry_date) : null
                          let pillBorder = 'border-slate-200'
                          if (days !== null) {
                            if (days <= 2) pillBorder = 'border-red-300'
                            else if (days <= 5) pillBorder = 'border-amber-300'
                          }

                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item.id)}
                              onDragEnd={() => { setDragItemId(null); setDragOverZone(null) }}
                              onClick={() => setMoveModalItem(item)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-white border ${pillBorder} text-sm cursor-grab active:cursor-grabbing transition-all ${
                                isPending ? 'opacity-50 pointer-events-none' : ''
                              } ${isDragging ? 'opacity-30 scale-95' : 'hover:shadow-sm'}`}
                            >
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              <span className="text-base leading-none">{categoryEmoji(item.category)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 text-sm truncate">{item.name}</p>
                                <p className="text-[11px] text-slate-400">{item.quantity} {item.unit}</p>
                              </div>
                              {days !== null && days <= 3 && (
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                                  days <= 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                  {days <= 0 ? '!' : `${days}g`}
                                </span>
                              )}
                              <div className="flex gap-1 shrink-0">
                                <form action={(fd) => handleAction(fd, useItem)} onClick={(e) => e.stopPropagation()}>
                                  <input type="hidden" name="id" value={item.id} />
                                  <button type="submit" disabled={isPending} className="text-olive-600 hover:bg-olive-50 p-1 rounded-md transition-colors">
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                </form>
                                <form action={(fd) => handleAction(fd, deleteItem)} onClick={(e) => e.stopPropagation()}>
                                  <input type="hidden" name="id" value={item.id} />
                                  <button type="submit" disabled={isPending} className="text-red-400 hover:bg-red-50 p-1 rounded-md transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </form>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Move modal (for mobile tap) */}
      {moveModalItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setMoveModalItem(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 pb-8 sm:pb-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Sposta {moveModalItem.name}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Attualmente in: {mapToZone(moveModalItem)}
            </p>
            <div className="flex flex-col gap-2">
              {ZONE_ORDER.filter(z => z !== mapToZone(moveModalItem)).map((zone) => {
                const config = ZONE_CONFIG[zone]
                const ZoneIcon = config.icon
                return (
                  <button
                    key={zone}
                    onClick={() => handleMoveToZone(moveModalItem, zone)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${config.borderColor} ${config.bodyBg} hover:shadow-sm transition-all`}
                  >
                    <ZoneIcon className={`w-5 h-5 ${config.headerText}`} />
                    <span className="font-semibold text-slate-800">Sposta in {zone}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setMoveModalItem(null)}
              className="w-full mt-3 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      <AddItemModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />

      {/* "Ho mangiato" Modal */}
      {showMealModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => !mealLoading && setShowMealModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 pb-8 sm:pb-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ho mangiato...</h3>
                <p className="text-xs text-slate-500">Scrivi cosa hai mangiato e aggiorno il frigo</p>
              </div>
            </div>

            {/* Result */}
            {mealResult && (
              <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                mealResult.error
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-olive-50 border border-olive-200 text-olive-800'
              }`}>
                {mealResult.error ? (
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />
                    {mealResult.error}
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold flex items-center gap-1.5 mb-1">
                      <Check className="w-4 h-4" /> Frigo aggiornato!
                    </p>
                    {mealResult.used.map((u, i) => (
                      <p key={i} className="text-xs ml-5.5">
                        {u.removed ? '🗑️' : '📉'} {u.name}: -{u.subtracted} {u.unit} {u.removed ? '(finito)' : ''}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={mealInput}
                onChange={(e) => setMealInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogMeal()}
                placeholder='Es: "Pasta al pesto per 2", "Frittata con 3 uova"'
                disabled={mealLoading}
                autoFocus
                className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm"
              />

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {['Pasta', 'Insalata', 'Panino', 'Frittata', 'Riso'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setMealInput(prev => prev ? prev : s.toLowerCase())}
                    className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={handleLogMeal}
                disabled={!mealInput.trim() || mealLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {mealLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aggiorno il frigo...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Aggiorna frigo
                  </>
                )}
              </button>

              <button
                onClick={() => { setShowMealModal(false); setMealResult(null) }}
                disabled={mealLoading}
                className="w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habit Modal */}
      {showHabitModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => !habitLoading && setShowHabitModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 pb-8 sm:pb-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Repeat className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Abitudini</h3>
                <p className="text-xs text-slate-500">Consumi ricorrenti che aggiorno automaticamente</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setHabitStep('input')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${habitStep !== 'list' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}
              >
                Nuova
              </button>
              <button
                onClick={async () => { setHabitStep('list'); try { setHabitList(await getHabits()) } catch {} }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${habitStep === 'list' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}
              >
                Le mie ({habitList.length})
              </button>
            </div>

            {habitError && (
              <div className="mb-3 rounded-xl px-4 py-2 text-sm bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" /> {habitError}
              </div>
            )}

            {/* Step 1: Input */}
            {habitStep === 'input' && (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={habitInput}
                  onChange={(e) => setHabitInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeHabit()}
                  placeholder='Es: "Ogni mattina caffè e 3 biscotti"'
                  disabled={habitLoading}
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all text-sm"
                />
                <div className="flex flex-wrap gap-1.5">
                  {['Caffè e biscotti la mattina', 'Yogurt a merenda', 'Latte prima di dormire'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setHabitInput(s)}
                      className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAnalyzeHabit}
                  disabled={!habitInput.trim() || habitLoading}
                  className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-xl py-3 font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {habitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
                  {habitLoading ? 'Analizzo...' : 'Analizza abitudine'}
                </button>
              </div>
            )}

            {/* Step 2: Confirm */}
            {habitStep === 'confirm' && habitDraft && (
              <div className="flex flex-col gap-3">
                <div className="bg-violet-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-violet-800 mb-2">"{habitDraft.description}"</p>
                  <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">Prodotti da scalare:</p>
                  {habitDraft.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-sm text-slate-700">{item.name}</span>
                      <span className="text-sm font-semibold text-slate-900">{item.qty} {item.unit}</span>
                    </div>
                  ))}
                </div>

                {/* Frequency picker */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Frequenza</p>
                  <div className="flex gap-2">
                    {[
                      { value: 'daily', label: 'Ogni giorno' },
                      { value: 'twice_daily', label: '2 volte/giorno' },
                      { value: 'weekly', label: 'Ogni settimana' },
                    ].map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setHabitDraft({ ...habitDraft, frequency: f.value })}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          habitDraft.frequency === f.value ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setHabitStep('input'); setHabitDraft(null) }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={handleSaveHabit}
                    disabled={habitLoading}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {habitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Conferma
                  </button>
                </div>
              </div>
            )}

            {/* List of existing habits */}
            {habitStep === 'list' && (
              <div className="flex flex-col gap-2">
                {habitList.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">Nessuna abitudine salvata</p>
                ) : (
                  habitList.map((h) => (
                    <div key={h.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{h.description}</p>
                        <p className="text-xs text-slate-400">
                          {h.items.map((item: HabitItem) => `${item.qty}${item.unit} ${item.name}`).join(', ')}
                          {' · '}
                          {h.frequency === 'daily' ? 'Ogni giorno' : h.frequency === 'twice_daily' ? '2x/giorno' : 'Settimanale'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteHabit(h.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            <button
              onClick={() => setShowHabitModal(false)}
              disabled={habitLoading}
              className="w-full mt-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
