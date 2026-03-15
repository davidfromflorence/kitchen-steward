import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function sendWhatsApp(phoneNumber: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!
  const authToken = process.env.TWILIO_AUTH_TOKEN!
  const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER!

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

  const params = new URLSearchParams({
    From: twilioNumber,
    To: `whatsapp:${phoneNumber}`,
    Body: message,
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error(`Failed to send to ${phoneNumber}:`, err)
    return false
  }
  return true
}

async function generateFoodFact(): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `Genera UN fatto curioso e utile sul cibo, la conservazione degli alimenti, o lo spreco alimentare.
Deve essere sorprendente, pratico, in italiano, e breve (max 2 frasi).
Rispondi SOLO con il fatto, senza prefissi o formattazione.`,
        }],
      }],
    })
    return response.text?.trim() || ''
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// GET — called by Vercel Cron daily at 8:00 AM
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  // Find all users with WhatsApp linked and a household
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, whatsapp_number, household_id, full_name')
    .not('whatsapp_number', 'is', null)
    .not('household_id', 'is', null)

  if (usersError || !users || users.length === 0) {
    return NextResponse.json({ message: 'No users to notify', sent: 0 })
  }

  // Get a daily food fact
  const foodFact = await generateFoodFact()

  let sent = 0

  for (const user of users) {
    // Get items expiring in next 3 days for this household
    const threeDays = new Date(Date.now() + 3 * 86_400_000).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    const { data: expiring } = await supabase
      .from('inventory_items')
      .select('name, quantity, unit, expiry_date')
      .eq('household_id', user.household_id)
      .lte('expiry_date', threeDays)
      .gte('expiry_date', today)
      .order('expiry_date', { ascending: true })

    const { data: expired } = await supabase
      .from('inventory_items')
      .select('name, quantity, unit, expiry_date')
      .eq('household_id', user.household_id)
      .lt('expiry_date', today)

    // Build message
    const firstName = user.full_name?.split(' ')[0] || 'Ciao'
    let message = `☀️ *Buongiorno ${firstName}!*\n`

    // Expired items alert
    if (expired && expired.length > 0) {
      message += `\n🔴 *Prodotti scaduti (${expired.length}):*\n`
      message += expired
        .map((i: { name: string; quantity: number; unit: string }) =>
          `  • ${i.quantity} ${i.unit} ${i.name}`
        )
        .join('\n')
      message += '\n_Controlla se sono ancora buoni o eliminali._\n'
    }

    // Expiring soon alert
    if (expiring && expiring.length > 0) {
      message += `\n🟡 *In scadenza (prossimi 3 giorni):*\n`
      message += expiring
        .map((i: { name: string; quantity: number; unit: string; expiry_date: string }) => {
          const days = Math.ceil(
            (new Date(i.expiry_date).getTime() - Date.now()) / 86_400_000
          )
          const when = days === 0 ? 'oggi' : days === 1 ? 'domani' : `tra ${days}g`
          return `  • ${i.quantity} ${i.unit} ${i.name} — ${when}`
        })
        .join('\n')
      message += '\n\n💡 Scrivi *ricetta* per usarli prima che scadano!'
    }

    // If nothing is expiring, just send the food fact
    if ((!expired || expired.length === 0) && (!expiring || expiring.length === 0)) {
      message += '\n✅ Nessun prodotto in scadenza. Tutto in ordine!'
    }

    // Add daily food fact
    if (foodFact) {
      message += `\n\n🧠 *Curiosità del giorno:*\n${foodFact}`
    }

    const ok = await sendWhatsApp(user.whatsapp_number, message)
    if (ok) sent++
  }

  return NextResponse.json({ message: 'Daily digest sent', sent })
}
