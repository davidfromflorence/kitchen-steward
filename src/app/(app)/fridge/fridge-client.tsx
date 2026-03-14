'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
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

/* ── Kitchen View helpers ─────────────────────────────────── */

type KitchenZone = 'Fridge' | 'Freezer' | 'Pantry'

function mapToZone(category: string): KitchenZone {
  const lower = category.toLowerCase()
  if (lower === 'frozen') return 'Freezer'
  if (['dairy', 'protein', 'vegetable', 'fruit'].includes(lower))
    return 'Fridge'
  return 'Pantry' // carbohydrate, condiment, general, beverage, etc.
}

const ZONE_CONFIG: Record<
  KitchenZone,
  {
    icon: typeof Refrigerator
    headerBg: string
    headerText: string
    borderColor: string
    emptyText: string
  }
> = {
  Fridge: {
    icon: Refrigerator,
    headerBg: 'bg-sky-100',
    headerText: 'text-sky-800',
    borderColor: 'border-sky-200',
    emptyText: 'Empty',
  },
  Freezer: {
    icon: Snowflake,
    headerBg: 'bg-cyan-100',
    headerText: 'text-indigo-800',
    borderColor: 'border-cyan-200',
    emptyText: 'Empty',
  },
  Pantry: {
    icon: Archive,
    headerBg: 'bg-amber-100',
    headerText: 'text-amber-800',
    borderColor: 'border-amber-200',
    emptyText: 'Empty',
  },
}

const ZONE_ORDER: KitchenZone[] = ['Fridge', 'Freezer', 'Pantry']

/* ── Component ────────────────────────────────────────────── */

export default function FridgeClient({ items }: { items: InventoryItem[] }) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kitchen'>('list')

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

  // Filter items — in kitchen view, category tabs are hidden so we only filter by search
  const filtered = items.filter((item) => {
    // Search filter
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    // Category filter (list view only)
    if (
      viewMode === 'list' &&
      activeTab !== 'All' &&
      mapCategory(item.category) !== activeTab
    ) {
      return false
    }
    return true
  })

  // Group items by zone for kitchen view
  const groupedByZone: Record<KitchenZone, InventoryItem[]> = {
    Fridge: [],
    Freezer: [],
    Pantry: [],
  }
  if (viewMode === 'kitchen') {
    for (const item of filtered) {
      groupedByZone[mapToZone(item.category)].push(item)
    }
  }

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

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('list')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-olive-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          List View
        </button>
        <button
          onClick={() => setViewMode('kitchen')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            viewMode === 'kitchen'
              ? 'bg-olive-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          Kitchen View
        </button>
      </div>

      {/* Category filter tabs — only in list view */}
      {viewMode === 'list' && (
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
      )}

      {/* ── List View ───────────────────────────────────────── */}
      {viewMode === 'list' && (
        <>
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
                      <span className="text-4xl">
                        {categoryEmoji(item.category)}
                      </span>

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
        </>
      )}

      {/* ── Kitchen View ────────────────────────────────────── */}
      {viewMode === 'kitchen' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          {ZONE_ORDER.map((zone) => {
            const config = ZONE_CONFIG[zone]
            const ZoneIcon = config.icon
            const zoneItems = groupedByZone[zone]

            return (
              <div
                key={zone}
                className={`bg-white rounded-3xl border ${config.borderColor} shadow-sm overflow-hidden`}
              >
                {/* Zone header */}
                <div
                  className={`${config.headerBg} px-5 py-4 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2.5">
                    <ZoneIcon className={`w-5 h-5 ${config.headerText}`} />
                    <h2
                      className={`text-base font-bold ${config.headerText}`}
                    >
                      {zone}
                    </h2>
                  </div>
                  <span
                    className={`text-xs font-semibold ${config.headerText} bg-white/60 px-2.5 py-1 rounded-full`}
                  >
                    {zoneItems.length} {zoneItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Zone body */}
                <div className="p-4 min-h-[200px]">
                  {zoneItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[160px]">
                      <p className="text-slate-300 text-sm italic">
                        {config.emptyText}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {zoneItems.map((item) => {
                        const isPending = pendingId === item.id
                        const days = item.expiry_date
                          ? daysUntilExpiry(item.expiry_date)
                          : null

                        let pillBorder = 'border-slate-200'
                        if (days !== null) {
                          if (days <= 0) pillBorder = 'border-red-400 border-2'
                          else if (days <= 2)
                            pillBorder = 'border-red-400 border-2'
                          else if (days <= 5)
                            pillBorder = 'border-amber-400 border-2'
                        }

                        return (
                          <div
                            key={item.id}
                            className={`group/pill relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border ${pillBorder} text-sm transition-all hover:shadow-sm ${
                              isPending
                                ? 'opacity-50 pointer-events-none'
                                : ''
                            }`}
                          >
                            <span className="text-base leading-none">
                              {categoryEmoji(item.category)}
                            </span>
                            <span className="font-medium text-slate-800 max-w-[120px] truncate">
                              {item.name}
                            </span>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {item.quantity} {item.unit}
                            </span>

                            {/* Hover actions on pill */}
                            <div className="hidden group-hover/pill:inline-flex items-center gap-0.5 ml-1">
                              <form
                                action={(fd) => handleAction(fd, useItem)}
                              >
                                <input
                                  type="hidden"
                                  name="id"
                                  value={item.id}
                                />
                                <button
                                  type="submit"
                                  disabled={isPending}
                                  className="text-olive-600 hover:text-olive-800 p-0.5 transition-colors"
                                  title="Use one"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                              </form>
                              <form
                                action={(fd) => handleAction(fd, deleteItem)}
                              >
                                <input
                                  type="hidden"
                                  name="id"
                                  value={item.id}
                                />
                                <button
                                  type="submit"
                                  disabled={isPending}
                                  className="text-red-400 hover:text-red-600 p-0.5 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
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
      )}

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  )
}
