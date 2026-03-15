import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

// Average cost per food category (€/unit estimate for Italy)
const AVG_COST: Record<string, number> = {
  Protein: 5.0,
  Vegetable: 2.0,
  Fruit: 2.5,
  Dairy: 2.0,
  Carbohydrate: 1.5,
  Condiment: 3.0,
  General: 2.5,
}

// Average kg CO2 saved per food item not wasted
const CO2_PER_ITEM = 2.5

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function sendWhatsApp(phoneNumber: string, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const params = new URLSearchParams({
    From: process.env.TWILIO_WHATSAPP_NUMBER!,
    To: `whatsapp:${phoneNumber}`,
    Body: message,
  })
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  return res.ok
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { data: users } = await supabase
    .from('users')
    .select('id, whatsapp_number, household_id, full_name')
    .not('whatsapp_number', 'is', null)
    .not('household_id', 'is', null)

  if (!users || users.length === 0) {
    return NextResponse.json({ message: 'No users', sent: 0 })
  }

  const households = new Map<string, typeof users>()
  for (const u of users) {
    if (!households.has(u.household_id)) households.set(u.household_id, [])
    households.get(u.household_id)!.push(u)
  }

  let sent = 0
  const oneWeekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  for (const [householdId, members] of households) {
    // Current inventory
    const { data: inventory } = await supabase
      .from('inventory_items')
      .select('name, quantity, unit, category, expiry_date, created_at')
      .eq('household_id', householdId)

    const items = inventory || []
    const totalItems = items.length
    const addedThisWeek = items.filter(i => i.created_at >= oneWeekAgo).length

    const today = new Date().toISOString().split('T')[0]
    const expired = items.filter(i => i.expiry_date && i.expiry_date < today).length
    const expiringSoon = items.filter(i => {
      if (!i.expiry_date) return false
      const days = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86_400_000)
      return days >= 0 && days <= 3
    }).length

    // Items that DIDN'T expire (managed well) = items with expiry that are still good
    const managedWell = items.filter(i => {
      if (!i.expiry_date) return false
      return i.expiry_date >= today
    }).length

    // Estimate savings: managed items × avg cost per category
    const moneySaved = items
      .filter(i => i.expiry_date && i.expiry_date >= today)
      .reduce((sum, i) => sum + (AVG_COST[i.category] || 2.5) * i.quantity, 0)

    const co2Saved = managedWell * CO2_PER_ITEM
    const mealsEquivalent = Math.round(managedWell / 3)

    // AI motivational message based on their performance
    let aiMessage = ''
    try {
      const performance = expired === 0 ? 'eccellente — zero sprechi!' :
        expired <= 2 ? 'buona — quasi zero sprechi' :
        'da migliorare — qualche prodotto è scaduto'

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{
            text: `Sei Kitchen Steward. La famiglia ha ${totalItems} prodotti nel frigo, ${expired} scaduti, ${managedWell} gestiti bene. Performance: ${performance}. Hanno risparmiato circa €${moneySaved.toFixed(0)} e ${co2Saved.toFixed(1)}kg CO2. Scrivi un commento motivazionale breve (2 frasi max) in italiano, celebrando i risultati o incoraggiando a fare meglio. Tono amichevole, usa emoji. No formattazione markdown.`,
          }],
        }],
      })
      aiMessage = result.text?.trim() || ''
    } catch {
      // Skip if Gemini fails
    }

    const memberNames = members.map(m => m.full_name?.split(' ')[0] || '').filter(Boolean).join(', ')

    let summary = `📊 *Report settimanale — Kitchen Steward*\n`
    summary += `👨‍👩‍👧 ${memberNames}\n\n`

    // Savings hero section
    summary += `💰 *I vostri risparmi questa settimana:*\n`
    summary += `  💶 ~€${moneySaved.toFixed(0)} di cibo salvato dallo spreco\n`
    summary += `  🌍 ~${co2Saved.toFixed(1)}kg CO₂ risparmiati\n`
    summary += `  🍽️ ~${mealsEquivalent} pasti equivalenti salvati\n\n`

    // Fridge status
    summary += `🧊 *Stato frigo:* ${totalItems} prodotti`
    if (addedThisWeek > 0) summary += ` (+${addedThisWeek} questa settimana)`
    summary += '\n'

    if (expired > 0) {
      summary += `🔴 ${expired} scaduti — da controllare\n`
    }
    if (expiringSoon > 0) {
      summary += `🟡 ${expiringSoon} in scadenza nei prossimi 3 giorni\n`
    }
    if (expired === 0) {
      summary += `✅ Zero sprechi questa settimana! 🎉\n`
    }

    // Score
    const score = expired === 0 ? '⭐⭐⭐⭐⭐' :
      expired <= 1 ? '⭐⭐⭐⭐' :
      expired <= 3 ? '⭐⭐⭐' : '⭐⭐'
    summary += `\n🏆 *Punteggio anti-spreco:* ${score}\n`

    if (aiMessage) {
      summary += `\n${aiMessage}\n`
    }

    summary += `\n⬇️ *Scegli:*\n1️⃣ Pianifica i pasti della settimana\n2️⃣ Genera la lista della spesa\n3️⃣ Mostra il frigo`

    for (const member of members) {
      const ok = await sendWhatsApp(member.whatsapp_number, summary)
      if (ok) sent++
    }
  }

  return NextResponse.json({ message: 'Weekly summaries sent', sent })
}
