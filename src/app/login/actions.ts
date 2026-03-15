'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kitchen-steward.vercel.app'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect(`/login?tab=signin&message=${encodeURIComponent('Please enter both email and password')}`)
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[login error]', error.message, '| email:', email)
    redirect(`/login?tab=signin&message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const fullName = (formData.get('full_name') as string)?.trim()

  if (!email || !password || !fullName) {
    redirect(`/login?message=${encodeURIComponent('Please fill in all fields')}`)
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error('[signup error]', error.message)
    redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  // Create the public.users profile row
  if (authData.user) {
    const { error: profileError } = await supabase.from('users').upsert({
      id: authData.user.id,
      full_name: fullName,
    })

    if (profileError) {
      console.error('[profile error]', profileError.message)
    }
  }

  // If email confirmation is enabled, user won't have a session yet
  // Show "check your email" message instead of redirecting to /setup
  const hasSession = !!authData.session
  if (hasSession) {
    // Email confirmation disabled — go straight to setup
    revalidatePath('/', 'layout')
    redirect('/setup')
  }

  // Email confirmation enabled — show confirmation message
  redirect(`/login?tab=confirm&email=${encodeURIComponent(email)}`)
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email) {
    redirect(`/login?tab=reset&message=${encodeURIComponent('Please enter your email')}`)
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/settings`,
  })

  if (error) {
    console.error('[reset error]', error.message)
    redirect(`/login?tab=reset&message=${encodeURIComponent(error.message)}`)
  }

  redirect(`/login?tab=signin&message=${encodeURIComponent('Check your email for a password reset link')}`)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
