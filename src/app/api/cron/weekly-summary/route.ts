import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

// Average cost estimates (€ per unit) by category
const COST_PER_UNIT: Record<string, number> = {
  Protein: 0.03,     // €/g — chicken ~€8/kg
  Vegetable: 0.004,  // €/g — avg veggies ~€4/kg
  Fruit: 0.004,      // €/g
  Dairy: 0.008,      // €/g — cheese/milk avg
  Carbohydrate: 0.003, // €/g — pasta/bread
  Condiment: 0.02,   // €/g — oils, sauces
  General: 0.005,    // €/g fallback
}

// Per-piece estimates when unit is "pz"
const COST_PER_PIECE: Record<string, number> = {
  Protein: 1.50,     // egg, chicken breast
  Vegetable: 0.80,
  Fruit: 0.50,
  Dairy: 1.20,       // mozzarella, yogurt
  Carbohydrate: 0.60,
  Condiment: 2.00,
  General: 1.00,
}

const CO2_PER_KG_FOOD = 2.5 // kg CO2 per kg of food not wasted

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
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: process.env.TWILIO_WHATSAPP_NUMBER!,
      To: `whatsapp:${phoneNumber}`,
      Body: message,
    }).toString(),
  })
  return res.ok
}

function estimateSaving(qty: number, unit: string, category: string): { euros: number; kgFood: number } {
  const cat = category || 'General'
  if (unit === 'pz') {
    const cost = (COST_PER_PIECE[cat] || 1.0) * qty
    return { euros: cost, kgFood: qty * 0.15 } // ~150g per piece avg
  }
  if (unit === 'ml' || unit === 'litri') {
    const ml = unit === 'litri' ? qty * 1000 : qty
    const cost = ml * 0.003 // ~€3/L average
    return { euros: cost, kgFood: ml / 1000 }
  }
  // g or kg
  const grams = unit === 'kg' ? qty * 1000 : qty
  const cost = grams * (COST_PER_UNIT[cat] || 0.005)
  return { euros: cost, kgFood: grams / 1000 }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const oneWeekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const { data: users } = await supabase
    .from('users')
    .select('id, whatsapp_number, household_id, full_name')
    .not('whatsapp_number', 'is', null)
    .not('household_id', 'is', null)

  if (!users || users.length === 0) {
    return NextResponse.json({ message: 'No users', sent: 0 })
  }

  // Group by household
  const households = new Map<string, typeof users>()
  for (const u of users) {
    if (!households.has(u.household_id)) households.set(u.household_id, [])
    households.get(u.household_id)!.push(u)
  }

  let sent = 0

  for (const [householdId, members] of households) {
    // Get this week's activity
    const { data: activities } = await supabase
      .from('activity_log')
      .select('action, item_name, item_quantity, item_unit, xp_earned, user_id, metadata')
      .eq('household_id', householdId)
      .gte('created_at', oneWeekAgo)

    const acts = activities || []

    // Get current inventory for expiry info
    const { data: inventory } = await supabase
      .from('inventory_items')
      .select('name, quantity, unit, category, expiry_date')
      .eq('household_id', householdId)

    const items = inventory || []
    const today = new Date().toISOString().split('T')[0]
    const expired = items.filter(i => i.expiry_date && i.expiry_date < today)
    const expiringSoon = items.filter(i => {
      if (!i.expiry_date) return false
      const days = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86_400_000)
      return days >= 0 && days <= 3
    })

    // Calculate real stats from activity log
    const itemsAdded = acts.filter(a => a.action === 'item_added').length
    const itemsUsed = acts.filter(a => a.action === 'item_used' || a.action === 'item_used_before_expiry')
    const itemsSavedBeforeExpiry = acts.filter(a => a.action === 'item_used_before_expiry')
    const mealsLogged = acts.filter(a => a.action === 'meal_logged').length
    const totalXP = acts.reduce((sum, a) => sum + (a.xp_earned || 0), 0)

    // Calculate money/food saved from items used (not wasted)
    let totalEurosSaved = 0
    let totalKgSaved = 0
    for (const used of itemsUsed) {
      // Find category from inventory or default
      const invItem = items.find(i => i.name === used.item_name)
      const category = invItem?.category || 'General'
      const { euros, kgFood } = estimateSaving(
        used.item_quantity || 1,
        used.item_unit || 'pz',
        category
      )
      totalEurosSaved += euros
      totalKgSaved += kgFood
    }

    const co2Saved = totalKgSaved * CO2_PER_KG_FOOD

    // Per-member stats
    const memberStats = members.map(m => {
      const memberActs = acts.filter(a => a.user_id === m.id)
      return {
        name: m.full_name?.split(' ')[0] || 'Utente',
        xp: memberActs.reduce((s, a) => s + (a.xp_earned || 0), 0),
        actions: memberActs.length,
        saved: memberActs.filter(a => a.action === 'item_used_before_expiry').length,
      }
    }).sort((a, b) => b.xp - a.xp)

    // AI motivational comment
    let aiComment = ''
    try {
      const performance = expired.length === 0
        ? 'eccellente — zero sprechi!'
        : expired.length <= 2
          ? 'buona — quasi zero sprechi'
          : 'da migliorare'

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{
            text: `Sei Kitchen Steward. Scrivi 2 frasi motivazionali per una famiglia italiana. Questa settimana: ${itemsUsed.length} prodotti usati, ${mealsLogged} pasti registrati, ${itemsSavedBeforeExpiry.length} prodotti salvati prima della scadenza, ${expired.length} scaduti. Performance: ${performance}. €${totalEurosSaved.toFixed(0)} risparmiati. Tono amichevole, incoraggiante, con 1-2 emoji. Solo testo, no formattazione.`,
          }],
        }],
      })
      aiComment = result.text?.trim() || ''
    } catch { /* skip */ }

    // Build message
    let msg = `📊 *Report settimanale*\n\n`

    // Savings hero
    if (totalEurosSaved > 0 || itemsUsed.length > 0) {
      msg += `💰 *Questa settimana avete risparmiato:*\n`
      msg += `  💶 *€${totalEurosSaved.toFixed(0)}* di cibo non sprecato\n`
      msg += `  🌍 *${co2Saved.toFixed(1)}kg* CO₂ in meno\n`
      msg += `  🍽️ *${mealsLogged}* pasti registrati\n`
      if (itemsSavedBeforeExpiry.length > 0) {
        msg += `  🏆 *${itemsSavedBeforeExpiry.length}* prodotti usati prima della scadenza!\n`
      }
      msg += '\n'
    }

    // Fridge status
    msg += `🧊 *Frigo:* ${items.length} prodotti`
    if (itemsAdded > 0) msg += ` (+${itemsAdded} aggiunti)`
    msg += '\n'
    if (expired.length > 0) {
      msg += `🔴 ${expired.length} scaduti: ${expired.slice(0, 3).map(i => i.name).join(', ')}${expired.length > 3 ? '...' : ''}\n`
    }
    if (expiringSoon.length > 0) {
      msg += `🟡 ${expiringSoon.length} in scadenza: ${expiringSoon.slice(0, 3).map(i => i.name).join(', ')}${expiringSoon.length > 3 ? '...' : ''}\n`
    }
    if (expired.length === 0) {
      msg += `✅ Zero sprechi questa settimana!\n`
    }

    // Score
    const stars = expired.length === 0 ? 5 : expired.length <= 1 ? 4 : expired.length <= 3 ? 3 : 2
    msg += `\n${'⭐'.repeat(stars)} *Punteggio:* ${stars}/5\n`

    // Leaderboard (if multiple members)
    if (memberStats.length > 1) {
      msg += `\n🏅 *Classifica:*\n`
      memberStats.forEach((m, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
        msg += `  ${medal} ${m.name} — ${m.xp} XP`
        if (m.saved > 0) msg += ` (${m.saved} salvati)`
        msg += '\n'
      })
    } else if (memberStats.length === 1 && totalXP > 0) {
      msg += `\n⚡ *${memberStats[0].name}:* +${totalXP} XP questa settimana\n`
    }

    if (aiComment) {
      msg += `\n💬 ${aiComment}\n`
    }

    msg += `\n⬇️ *Scegli:*\n1️⃣ Pianifica i pasti della settimana\n2️⃣ Genera la lista della spesa\n3️⃣ Mostra il frigo`

    for (const member of members) {
      const ok = await sendWhatsApp(member.whatsapp_number, msg)
      if (ok) sent++
    }
  }

  return NextResponse.json({ message: 'Weekly summaries sent', sent })
}
