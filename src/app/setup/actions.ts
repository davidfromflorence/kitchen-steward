'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { customAlphabet } from 'nanoid'

const generateJoinCode = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  8
)

export async function createHousehold(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const joinCode = generateJoinCode()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // 1. Generate ID upfront (avoids RLS read-back issue)
  const householdId = crypto.randomUUID()

  const { error: hError } = await supabase
    .from('households')
    .insert([{ id: householdId, name, join_code: joinCode }])

  if (hError) {
    console.error('Error creating household:', hError)
    return redirect('/setup?error=Failed to create household')
  }

  // 2. Link the user to the household
  const { error: uError } = await supabase
    .from('users')
    .update({ household_id: householdId })
    .eq('id', user.id)

  if (uError) {
    console.error('Error linking user to household:', uError)
    return redirect('/setup?error=Failed to link user to household')
  }

  revalidatePath('/dashboard')
  redirect(`/household?welcome=true&code=${joinCode}`)
}

export async function joinHousehold(formData: FormData) {
  const supabase = await createClient()
  const joinCode = (formData.get('join_code') as string)?.toUpperCase()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // 1. Find the household
  const { data: household, error: hError } = await supabase
    .from('households')
    .select('id')
    .eq('join_code', joinCode)
    .single()

  if (hError || !household) {
    return redirect('/setup?error=Invalid join code')
  }

  // 2. Link the user
  const { error: uError } = await supabase
    .from('users')
    .update({ household_id: household.id })
    .eq('id', user.id)

  if (uError) {
    return redirect('/setup?error=Failed to join household')
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
