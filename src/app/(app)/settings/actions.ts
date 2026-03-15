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

  // Send welcome message via WhatsApp
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kitchen-steward.vercel.app'
    await fetch(`${siteUrl}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: phone,
        message: `🎉 *Benvenuto su Kitchen Steward!*

Il tuo numero WhatsApp è stato collegato con successo.

Ecco cosa posso fare per te:

1️⃣ Scrivi *frigo* — per vedere cosa c'è nel frigo
2️⃣ Scrivi *ricetta* — per un suggerimento anti-spreco
3️⃣ Scrivi *spesa* — per generare la lista della spesa
4️⃣ Scrivi *aiuto* — per tutti i comandi

Oppure scrivimi in modo naturale, tipo:
🗣️ "Ho comprato pollo, uova e latte"
🗣️ "Cosa cucino stasera?"
🗣️ "Cosa mi manca?"

Provami subito! 👇`,
      }),
    })
  } catch (e) {
    // Don't fail the action if the welcome message fails
    console.error('[welcome message error]', e)
  }

  revalidatePath('/settings')
  return { success: true }
}
