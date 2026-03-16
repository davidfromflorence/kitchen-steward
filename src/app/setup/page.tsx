import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createHousehold, joinHousehold } from './actions'
import { Leaf, Home, Users } from 'lucide-react'

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (profile?.household_id) return redirect('/dashboard')

  const { error, code } = await searchParams

  // If a join code is in the URL (from share link), pre-fill it
  const prefillCode = code || ''

  return (
    <div className="flex-1 flex flex-col w-full px-6 sm:max-w-lg mx-auto justify-center gap-2 mt-12 pb-16 animate-in">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-olive-100 p-3 rounded-2xl mb-4">
          <Leaf className="w-10 h-10 text-olive-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Ultimo passo!</h1>
        <p className="text-slate-500 mt-2 text-center text-sm">
          Per gestire il frigo, crea o unisciti a un nucleo familiare.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Create Household */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="p-2 bg-olive-50 rounded-lg">
              <Home className="w-5 h-5 text-olive-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Crea un nuovo frigo</h2>
          </div>
          <form action={createHousehold} className="px-5 pb-5 flex flex-col gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Nome della famiglia
            </label>
            <input
              className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-500 transition-all"
              name="name"
              placeholder="es. Famiglia Bottai"
              required
            />
            <button
              type="submit"
              className="bg-olive-600 hover:bg-olive-700 text-white rounded-xl py-3 font-semibold transition-all w-full active:scale-95"
            >
              Crea e inizia
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-cream px-3 text-slate-400 font-bold">oppure</span>
          </div>
        </div>

        {/* Join Household */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Unisciti a un frigo</h2>
          </div>
          <form action={joinHousehold} className="px-5 pb-5 flex flex-col gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Codice invito
            </label>
            <input
              className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase tracking-widest text-center font-mono text-lg"
              name="join_code"
              placeholder="XXXXXXXX"
              defaultValue={prefillCode}
              maxLength={8}
              required
            />
            <p className="text-xs text-slate-400 text-center">
              Chiedi il codice a chi ha creato il frigo, oppure usa il link di invito.
            </p>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-semibold transition-all w-full active:scale-95"
            >
              Unisciti
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 text-center rounded-xl text-sm font-medium">
          {error}
        </div>
      )}
    </div>
  )
}
