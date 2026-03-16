'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { customAlphabet } from 'nanoid'

const generateJoinCode = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  8
)

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createHousehold(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const joinCode = generateJoinCode()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const householdId = crypto.randomUUID()

  // Use admin client to bypass RLS for insert
  const admin = getSupabaseAdmin()

  const { error: hError } = await admin
    .from('households')
    .insert([{ id: householdId, name, join_code: joinCode }])

  if (hError) {
    console.error('Error creating household:', hError)
    return redirect(`/setup?error=${encodeURIComponent('Errore: ' + hError.message)}`)
  }

  const { error: uError } = await admin
    .from('users')
    .update({ household_id: householdId })
    .eq('id', user.id)

  if (uError) {
    console.error('Error linking user:', uError)
    return redirect(`/setup?error=${encodeURIComponent('Errore: ' + uError.message)}`)
  }

  revalidatePath('/dashboard')
  redirect(`/household?welcome=true&code=${joinCode}`)
}

export async function joinHousehold(formData: FormData) {
  const supabase = await createClient()
  const joinCode = (formData.get('join_code') as string)?.trim().toUpperCase()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Use admin client to bypass RLS — new users can't see households yet
  const admin = getSupabaseAdmin()

  const { data: household, error: hError } = await admin
    .from('households')
    .select('id, name')
    .eq('join_code', joinCode)
    .single()

  if (hError || !household) {
    console.error('Join code error:', hError?.message, 'code:', joinCode)
    return redirect(`/setup?error=${encodeURIComponent('Codice non valido. Controlla e riprova.')}`)
  }

  const { error: uError } = await admin
    .from('users')
    .update({ household_id: household.id })
    .eq('id', user.id)

  if (uError) {
    return redirect(`/setup?error=${encodeURIComponent('Errore nel collegamento. Riprova.')}`)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
