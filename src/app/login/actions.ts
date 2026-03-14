'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('[login error]', error.message)
    redirect(`/login?tab=signin&message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
      },
    },
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('[signup error]', error.message)
    redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  // Create the public.users profile row
  if (authData.user) {
    const { error: profileError } = await supabase.from('users').upsert({
      id: authData.user.id,
      full_name: formData.get('full_name') as string,
    })

    if (profileError) {
      console.error('[profile error]', profileError.message)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/setup')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
