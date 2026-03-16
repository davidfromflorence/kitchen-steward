'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2 } from 'lucide-react'

export default function ConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Supabase auto-detects the hash fragment and exchanges it for a session
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        router.replace('/setup')
      }
    })

    // Fallback: if already signed in, redirect
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/setup')
    })

    // Timeout fallback
    const timeout = setTimeout(() => {
      router.replace('/login?tab=signin&message=' + encodeURIComponent('Sessione scaduta. Accedi di nuovo.'))
    }, 10000)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="w-8 h-8 text-olive-600 animate-spin" />
      <p className="text-slate-500 text-sm">Conferma in corso...</p>
    </div>
  )
}
