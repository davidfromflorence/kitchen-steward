'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect(`/login?tab=signin&message=${encodeURIComponent('Please enter both email and password')}`)
  }

  console.log('[login attempt]', email, '| password length:', password.length)

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[login error]', error.message, '| email:', email, '| password length:', password.length)
    const debug = `${error.message} (email: ${email}, pwd length: ${password?.length ?? 'null'})`
    redirect(`/login?tab=signin&message=${encodeURIComponent(debug)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const fullName = (formData.get('full_name') as string)?.trim()

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
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

  revalidatePath('/', 'layout')
  redirect('/setup')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email) {
    redirect(`/login?tab=reset&message=${encodeURIComponent('Please enter your email')}`)
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kitchen-steward.vercel.app'}/auth/callback?next=/login?tab=signin`,
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
