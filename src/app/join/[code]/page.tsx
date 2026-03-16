import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Leaf, Users } from 'lucide-react'
import Link from 'next/link'

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  // Check if user is logged in
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Already logged in — redirect to setup with code pre-filled
    redirect(`/setup?code=${code}`)
  }

  // Not logged in — show landing with join code context
  return (
    <div className="flex-1 flex flex-col w-full px-6 sm:max-w-md mx-auto justify-center gap-6 mt-16 pb-16">
      <div className="flex flex-col items-center mb-4">
        <div className="bg-olive-100 p-3 rounded-2xl mb-4">
          <Leaf className="w-10 h-10 text-olive-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Kitchen Steward</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Sei stato invitato!</h2>
        <p className="text-sm text-slate-500 mb-4">
          Qualcuno ti ha invitato a gestire il frigo insieme.
        </p>
        <div className="bg-slate-50 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-slate-400 font-medium mb-1">Codice invito</p>
          <p className="text-2xl font-mono font-bold text-slate-800 tracking-widest">{code.toUpperCase()}</p>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Crea un account per unirti. Il codice verrà inserito automaticamente.
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href={`/login?redirect=/setup?code=${code}`}
            className="block w-full bg-olive-600 hover:bg-olive-700 text-white rounded-xl py-3 font-semibold transition-all text-center active:scale-95"
          >
            Crea account
          </Link>
          <Link
            href={`/login?tab=signin&redirect=/setup?code=${code}`}
            className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-3 font-semibold transition-all text-center active:scale-95"
          >
            Ho già un account
          </Link>
        </div>
      </div>
    </div>
  )
}
