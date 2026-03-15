import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/setup'

  const supabase = await createClient()

  // Handle PKCE code exchange (used by password reset, magic links)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user has a household — if so, go to dashboard
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('household_id')
          .eq('id', user.id)
          .single()

        const destination = profile?.household_id ? '/dashboard' : '/setup'
        return NextResponse.redirect(`${origin}${next === '/setup' ? destination : next}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth callback] code exchange error:', error.message)
  }

  // Handle token hash (used by email confirmation links)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as 'signup' | 'email' })
    if (!error) {
      // Check if user has a household
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('household_id')
          .eq('id', user.id)
          .single()

        const destination = profile?.household_id ? '/dashboard' : '/setup'
        return NextResponse.redirect(`${origin}${destination}`)
      }
      return NextResponse.redirect(`${origin}/setup`)
    }
    console.error('[auth callback] verify OTP error:', error.message)
  }

  return NextResponse.redirect(
    `${origin}/login?tab=signin&message=${encodeURIComponent('The link is invalid or has expired. Please try again.')}`
  )
}
