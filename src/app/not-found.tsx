import { Leaf } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 px-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-md text-center">
        <div className="bg-olive-100 p-3 rounded-2xl inline-block mb-4">
          <Leaf className="w-8 h-8 text-olive-600" />
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-slate-500 mb-6">
          Questa pagina non esiste. Forse è scaduta?
        </p>
        <a
          href="/dashboard"
          className="inline-block bg-olive-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-olive-700 active:scale-95 transition-all"
        >
          Torna al frigo
        </a>
      </div>
    </div>
  )
}
