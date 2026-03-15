'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function updatePhoneNumber(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autenticato.' }
  }

  const raw = formData.get('phone_number') as string | null
  if (!raw || raw.trim() === '') {
    return { error: 'Inserisci un numero di telefono.' }
  }

  // Clean: strip spaces, ensure starts with +
  let phone = raw.replace(/\s+/g, '')
  if (!phone.startsWith('+')) {
    phone = '+' + phone
  }

  // Basic validation: must be at least 8 digits after the +
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) {
    return { error: 'Numero di telefono non valido.' }
  }

  const { error } = await supabase
    .from('users')
    .update({ whatsapp_number: phone })
    .eq('id', user.id)

  if (error) {
    console.error('[updatePhoneNumber error]', error.message)
    return { error: 'Errore durante il salvataggio. Riprova.' }
  }

  revalidatePath('/settings')
  return { success: true }
}
