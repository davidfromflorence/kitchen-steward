'use client'

import { useState, useTransition } from 'react'
import {
  Plus,
  Trash2,
  Search,
  Share2,
  ShoppingCart,
  Sparkles,
  X,
} from 'lucide-react'
import {
  addShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  addSuggestionToList,
} from './actions'

export interface SuggestionItem {
  id: string
  name: string
  category: string
  status: string
  borderColor: string
}

export interface ShoppingItem {
  id: string
  name: string
  category: string
  notes: string | null
  checked: boolean
}

interface ShoppingClientProps {
  suggestions: SuggestionItem[]
  listItems: ShoppingItem[]
  inventoryNames: string[]
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Produce: '\uD83E\uDD6C',
  'Dairy & Eggs': '\uD83E\uDD5B',
  Pantry: '\uD83E\uDED9',
  Meat: '\uD83E\uDD69',
  Seafood: '\uD83D\uDC1F',
  Frozen: '\u2744\uFE0F',
  Beverages: '\uD83E\uDDC3',
  Snacks: '\uD83C\uDF7F',
  Bakery: '\uD83C\uDF5E',
  General: '\uD83D\uDED2',
}

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] || '\uD83D\uDED2'
}

export default function ShoppingClient({
  suggestions,
  listItems,
  inventoryNames,
}: ShoppingClientProps) {
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('General')
  const [customNotes, setCustomNotes] = useState('')

  const inventorySet = new Set(inventoryNames.map((n) => n.toLowerCase()))

  // Group items by category
  const grouped = listItems.reduce<Record<string, ShoppingItem[]>>(
    (acc, item) => {
      const cat = item.category || 'General'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    },
    {}
  )

  // Filter by search
  const filteredGroups = Object.entries(grouped).reduce<
    Record<string, ShoppingItem[]>
  >((acc, [cat, items]) => {
    const filtered = searchQuery
      ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (i.notes &&
              i.notes.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : items
    if (filtered.length > 0) acc[cat] = filtered
    return acc
  }, {})

  function handleToggle(item: ShoppingItem) {
    setPendingId(item.id)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', item.id)
      fd.set('checked', String(item.checked))
      await toggleShoppingItem(fd)
      setPendingId(null)
    })
  }

  function handleDelete(id: string) {
    setPendingId(id)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', id)
      await deleteShoppingItem(fd)
      setPendingId(null)
    })
  }

  function handleAddSuggestion(suggestion: SuggestionItem) {
    setPendingId(suggestion.id)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('name', suggestion.name)
      fd.set('category', suggestion.category)
      fd.set('notes', `Added from suggestion: ${suggestion.status}`)
      await addSuggestionToList(fd)
      setPendingId(null)
    })
  }

  function handleAddAllSuggestions() {
    startTransition(async () => {
      for (const s of suggestions) {
        const fd = new FormData()
        fd.set('name', s.name)
        fd.set('category', s.category)
        fd.set('notes', `Added from suggestion: ${s.status}`)
        await addSuggestionToList(fd)
      }
    })
  }

  function handleAddCustom() {
    if (!customName.trim()) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('name', customName.trim())
      fd.set('category', customCategory)
      fd.set('notes', customNotes.trim() || '')
      await addShoppingItem(fd)
      setCustomName('')
      setCustomNotes('')
      setShowCustomInput(false)
    })
  }

  const uncheckedCount = listItems.filter((i) => !i.checked).length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-olive-600" />
            Shopping List
          </h1>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="border border-olive-400 text-olive-700 text-sm font-semibold px-3 py-1.5 rounded-xl hover:bg-olive-50 transition-colors flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            Share List
          </button>
          <div className="w-8 h-8 rounded-full bg-olive-100 text-olive-700 font-bold text-sm flex items-center justify-center">
            U
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-olive-300 focus:border-olive-400 transition-all"
        />
      </div>

      {/* Automatic Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Automatic Suggestions
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Based on items recently consumed or expired
              </p>
            </div>
            <button
              onClick={handleAddAllSuggestions}
              disabled={isPending}
              className="text-xs font-semibold text-olive-600 hover:text-olive-700 transition-colors disabled:opacity-50"
            >
              Add All to List
            </button>
          </div>
          <div className="p-4 flex gap-3 overflow-x-auto">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className={`flex-shrink-0 w-44 bg-cream rounded-xl p-3 border border-slate-100 transition-opacity ${
                  pendingId === s.id ? 'opacity-50' : ''
                }`}
                style={{ borderLeftWidth: '3px', borderLeftColor: s.borderColor }}
              >
                <h4 className="font-semibold text-sm text-slate-800 truncate">
                  {s.name}
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1 block">
                  {s.status}
                </span>
                <button
                  onClick={() => handleAddSuggestion(s)}
                  disabled={isPending}
                  className="mt-2 w-full bg-olive-50 text-olive-700 text-xs font-semibold py-1.5 rounded-lg hover:bg-olive-100 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  Add to List
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            Active List
            {uncheckedCount > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''})
              </span>
            )}
          </h2>
          <button
            onClick={() => setShowCustomInput(true)}
            className="text-sm font-semibold text-olive-600 hover:text-olive-700 transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Custom Item
          </button>
        </div>

        {/* Custom Item Inline Input */}
        {showCustomInput && (
          <div className="px-5 py-4 border-b border-slate-100 bg-olive-50/30">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Item name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                  autoFocus
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-olive-300"
                />
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-olive-300"
                >
                  {Object.keys(CATEGORY_EMOJIS).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-olive-300"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCustomInput(false)
                    setCustomName('')
                    setCustomNotes('')
                  }}
                  className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustom}
                  disabled={!customName.trim() || isPending}
                  className="px-4 py-1.5 bg-olive-600 text-white text-sm font-semibold rounded-lg hover:bg-olive-700 transition-colors disabled:opacity-50"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grouped Items */}
        {Object.keys(filteredGroups).length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {listItems.length === 0
              ? 'Your shopping list is empty. Add items or check the suggestions above!'
              : 'No items match your search.'}
          </div>
        ) : (
          <div>
            {Object.entries(filteredGroups).map(([category, items]) => (
              <div key={category}>
                {/* Category Header */}
                <div className="px-5 py-2.5 bg-cream-dark border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {getCategoryEmoji(category)} {category}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-50">
                  {items.map((item) => {
                    const inInventory = inventorySet.has(item.name.toLowerCase())
                    const isItemPending = pendingId === item.id

                    return (
                      <div
                        key={item.id}
                        className={`px-5 py-3 flex items-center gap-3 transition-opacity ${
                          isItemPending ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggle(item)}
                          disabled={isPending}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            item.checked
                              ? 'bg-olive-600 border-olive-600'
                              : 'border-slate-300 hover:border-olive-400'
                          }`}
                        >
                          {item.checked && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>

                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-semibold text-sm truncate ${
                              item.checked
                                ? 'line-through text-slate-400'
                                : 'text-slate-800'
                            }`}
                          >
                            {item.name}
                          </h3>
                          {item.notes && (
                            <p
                              className={`text-xs mt-0.5 truncate ${
                                item.checked
                                  ? 'line-through text-slate-300'
                                  : 'text-slate-500'
                              }`}
                            >
                              {item.notes}
                            </p>
                          )}
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {inInventory && !item.checked && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              In Fridge
                            </span>
                          )}
                          {!item.checked && !inInventory && (
                            <span className="text-[10px] font-bold text-olive-600 bg-olive-50 px-2 py-0.5 rounded-full">
                              Quick Add
                            </span>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={isPending}
                            className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
