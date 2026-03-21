'use client'

import { Leaf } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 px-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-md text-center">
        <div className="bg-olive-100 p-3 rounded-2xl inline-block mb-4">
          <Leaf className="w-8 h-8 text-olive-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Sei offline
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Controlla la connessione a internet e riprova.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-olive-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-olive-700 active:scale-95 transition-all"
        >
          Riprova
        </button>
      </div>
    </div>
  )
}
