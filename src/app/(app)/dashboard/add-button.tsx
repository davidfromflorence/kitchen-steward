'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import AddItemModal from '@/app/(app)/fridge/add-item-modal'

export default function AddButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-olive-600 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg hover:bg-olive-700 active:scale-95 transition-all text-sm"
      >
        <Plus className="w-4 h-4" />
        Add Item
      </button>
      <AddItemModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
