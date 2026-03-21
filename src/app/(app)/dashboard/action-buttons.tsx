'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import AddItemModal from '@/app/(app)/fridge/add-item-modal'

export default function ActionButtons() {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowAdd(true)}
        className="inline-flex items-center gap-1.5 bg-olive-600 text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-olive-700 active:scale-95 transition-all"
      >
        <Plus className="w-4 h-4" />
        Aggiungi
      </button>

      <AddItemModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </>
  )
}
