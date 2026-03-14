'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Plus, Trash2, Minus } from 'lucide-react'
import { deleteItem, useItem } from '@/app/actions/inventory'
import AddItemModal from './add-item-modal'

interface InventoryItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  expiry_date: string
}

const CATEGORY_TABS = [
  { label: 'All', value: 'All' },
  { label: 'Produce', value: 'Produce' },
  { label: 'Dairy & Eggs', value: 'Dairy & Eggs' },
  { label: 'Proteins', value: 'Proteins' },
  { label: 'Pantry', value: 'Pantry' },
  { label: 'Frozen', value: 'Frozen' },
  { label: 'Beverages', value: 'Beverages' },
] as const

/** Map raw DB categories to display tab categories */
function mapCategory(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower === 'vegetable' || lower === 'fruit') return 'Produce'
  if (lower === 'dairy') return 'Dairy & Eggs'
  if (lower === 'protein') return 'Proteins'
  if (lower === 'carbohydrate' || lower === 'condiment') return 'Pantry'
  if (lower === 'frozen') return 'Frozen'
  if (lower === 'beverage' || lower === 'beverages') return 'Beverages'
  // "General" and anything else
  return 'Other'
}

/** Gradient class for the card image placeholder based on category */
function categoryGradient(raw: string): string {
  const mapped = mapCategory(raw)
  switch (mapped) {
    case 'Produce':
      return 'from-emerald-300 to-green-500'
    case 'Dairy & Eggs':
      return 'from-sky-200 to-blue-400'
    case 'Proteins':
      return 'from-amber-300 to-orange-500'
    case 'Pantry':
      return 'from-yellow-200 to-amber-400'
    case 'Frozen':
      return 'from-cyan-200 to-sky-400'
    case 'Beverages':
      return 'from-violet-300 to-purple-500'
    default:
      return 'from-slate-200 to-slate-400'
  }
}

/** Emoji placeholder for each category */
function categoryEmoji(raw: string): string {
  const mapped = mapCategory(raw)
  switch (mapped) {
    case 'Produce':
      return '🥬'
    case 'Dairy & Eggs':
      return '🥛'
    case 'Proteins':
      return '🥩'
    case 'Pantry':
      return '🫙'
    case 'Frozen':
      return '🧊'
    case 'Beverages':
      return '🥤'
    default:
      return '🍽️'
  }
}

function daysUntilExpiry(expiryDate: string): number {
  return Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / 86400000
  )
}

function expiryBadge(expiryDate: string) {
  const days = daysUntilExpiry(expiryDate)

  if (days <= 0) {
    return {
      label: 'Expired',
      className: 'bg-red-100 text-red-700',
    }
  }

  const dateStr = new Date(expiryDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })

  if (days <= 2) {
    return {
      label: `Exp. ${dateStr}`,
      className: 'bg-red-100 text-red-700',
    }
  }

  if (days <= 5) {
    return {
      label: `Exp. ${dateStr}`,
      className: 'bg-amber-100 text-amber-700',
    }
  }

  return {
    label: `Exp. ${dateStr}`,
    className: 'bg-slate-100 text-slate-600',
  }
}

export default function FridgeClient({ items }: { items: InventoryItem[] }) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Auto-open modal if ?add=true is in the URL
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true)
    }
  }, [searchParams])

  const freshCount = items.filter((i) => {
    if (!i.expiry_date) return true
    return daysUntilExpiry(i.expiry_date) > 0
  }).length

  // Filter items
  const filtered = items.filter((item) => {
    // Search filter
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    // Category filter
    if (activeTab !== 'All' && mapCategory(item.category) !== activeTab) {
      return false
    }
    return true
  })

  async function handleAction(
    formData: FormData,
    action: typeof deleteItem | typeof useItem
  ) {
    const id = formData.get('id') as string
    setPendingId(id)
    try {
      await action(formData)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Fridge</h1>
          <p className="text-sm text-slate-500 mt-1">
            Currently tracking{' '}
            <span className="font-semibold text-olive-600">{freshCount}</span>{' '}
            fresh ingredients
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-transparent w-48 sm:w-56"
            />
          </div>

          {/* Add Item button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-olive-600 hover:bg-olive-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.value
                ? 'bg-olive-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Item grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-lg">
            {search || activeTab !== 'All'
              ? 'No items match your filters.'
              : 'Your fridge is empty! Add some items to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((item) => {
            const isPending = pendingId === item.id
            const badge = item.expiry_date
              ? expiryBadge(item.expiry_date)
              : null

            return (
              <div
                key={item.id}
                className={`group bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md ${
                  isPending ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {/* Category-colored image placeholder */}
                <div
                  className={`h-28 bg-gradient-to-br ${categoryGradient(item.category)} flex items-center justify-center relative`}
                >
                  <span className="text-4xl">{categoryEmoji(item.category)}</span>

                  {/* Hover actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <form action={(fd) => handleAction(fd, useItem)}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="bg-white/90 backdrop-blur-sm text-olive-700 hover:bg-olive-100 p-1.5 rounded-lg shadow-sm transition-colors"
                        title="Use one"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </form>
                    <form action={(fd) => handleAction(fd, deleteItem)}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-100 p-1.5 rounded-lg shadow-sm transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-3">
                  <h3 className="font-bold text-slate-800 text-sm truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.quantity} {item.unit}
                  </p>
                  {badge && (
                    <span
                      className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  )
}
