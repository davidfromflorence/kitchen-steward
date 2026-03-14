'use client'

import { useState } from 'react'
import { Trash2, Minus } from 'lucide-react'
import { deleteItem, useItem } from './actions'

interface InventoryItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  expiry_date: string
}

export default function InventoryList({ items }: { items: InventoryItem[] }) {
  const [pending, setPending] = useState<string | null>(null)

  function daysLeft(expiryDate: string) {
    return Math.ceil(
      (new Date(expiryDate).getTime() - Date.now()) / 86400000
    )
  }

  function expiryColor(days: number) {
    if (days <= 0) return 'text-red-600 font-bold'
    if (days <= 2) return 'text-red-500 font-bold'
    if (days <= 5) return 'text-amber-600 font-bold'
    return 'text-slate-500'
  }

  function expiryLabel(days: number) {
    if (days <= 0) return 'Expired!'
    if (days === 1) return 'Expires tomorrow'
    return `${days} days left`
  }

  async function handleAction(formData: FormData, action: typeof deleteItem | typeof useItem) {
    const id = formData.get('id') as string
    setPending(id)
    try {
      await action(formData)
    } finally {
      setPending(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Your fridge is empty! Tap + to add groceries.
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => {
        const days = daysLeft(item.expiry_date)
        const isPending = pending === item.id

        return (
          <div
            key={item.id}
            className={`p-4 sm:px-6 flex items-center gap-3 transition-opacity ${
              isPending ? 'opacity-50' : ''
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 truncate">
                  {item.name}
                </h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                  {item.category}
                </span>
              </div>
              <div className="flex gap-3 text-xs mt-1 font-medium">
                <span className="text-slate-500">
                  {item.quantity} {item.unit}
                </span>
                <span>&bull;</span>
                <span className={expiryColor(days)}>{expiryLabel(days)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <form
                action={(fd) => handleAction(fd, useItem)}
              >
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="text-olive-600 bg-olive-50 hover:bg-olive-100 p-2 rounded-lg transition-colors disabled:opacity-50"
                  title="Use one"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </form>
              <form
                action={(fd) => handleAction(fd, deleteItem)}
              >
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )
      })}
    </div>
  )
}
