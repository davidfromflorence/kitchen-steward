'use client'

import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import AddItemModal from './add-item-modal'
import AiInput from './ai-input'

export default function DashboardActions() {
  const [showManual, setShowManual] = useState(false)
  const [showAi, setShowAi] = useState(false)

  return (
    <>
      {/* FAB buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAi(true)}
          className="bg-slate-100 text-slate-600 p-3 rounded-full hover:bg-slate-200 active:scale-95 transition-all"
          title="AI Add"
        >
          <Sparkles className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowManual(true)}
          className="bg-olive-600 text-white p-3 rounded-full shadow-lg hover:bg-olive-700 active:scale-95 transition-all"
          title="Add item"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modals */}
      <AddItemModal isOpen={showManual} onClose={() => setShowManual(false)} />
      <AiInput isOpen={showAi} onClose={() => setShowAi(false)} />
    </>
  )
}
