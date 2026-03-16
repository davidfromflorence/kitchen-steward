import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'email' | 'recovery' | null

  const supabase = await createClient()

  // Handle PKCE code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${await getDestination(supabase)}`)
    }
    console.error('[auth callback] code exchange error:', error.message)
  }

  // Handle token hash (email confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${await getDestination(supabase)}`)
    }
    console.error('[auth callback] verify OTP error:', error.message)
  }

  // If no code or token_hash, the token might be in the URL hash fragment
  // Redirect to a client page that can extract it
  return NextResponse.redirect(
    `${origin}/auth/confirm`
  )
}

async function getDestination(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .single()
      return profile?.household_id ? '/dashboard' : '/setup'
    }
  } catch {
    // Fall through
  }
  return '/setup'
}
