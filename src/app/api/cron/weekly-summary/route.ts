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

  // Get all households with WhatsApp users
  const { data: users } = await supabase
    .from('users')
    .select('id, whatsapp_number, household_id, full_name')
    .not('whatsapp_number', 'is', null)
    .not('household_id', 'is', null)

  if (!users || users.length === 0) {
    return NextResponse.json({ message: 'No users', sent: 0 })
  }

  // Group by household to avoid duplicate reports
  const households = new Map<string, typeof users>()
  for (const u of users) {
    if (!households.has(u.household_id)) households.set(u.household_id, [])
    households.get(u.household_id)!.push(u)
  }

  let sent = 0
  const oneWeekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  for (const [householdId, members] of households) {
    // Get current inventory
    const { data: inventory } = await supabase
      .from('inventory_items')
      .select('name, quantity, unit, category, expiry_date, created_at')
      .eq('household_id', householdId)

    const items = inventory || []
    const totalItems = items.length
    const addedThisWeek = items.filter(i => i.created_at >= oneWeekAgo).length

    // Count expired items
    const today = new Date().toISOString().split('T')[0]
    const expired = items.filter(i => i.expiry_date && i.expiry_date < today).length
    const expiringSoon = items.filter(i => {
      if (!i.expiry_date) return false
      const days = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86_400_000)
      return days >= 0 && days <= 3
    }).length

    // Get shopping list stats
    const { data: shoppingItems } = await supabase
      .from('shopping_list_items')
      .select('checked')
      .eq('household_id', householdId)

    const shoppingTotal = shoppingItems?.length || 0
    const shoppingChecked = shoppingItems?.filter(i => i.checked).length || 0

    // Generate AI weekly tip
    const inventoryList = items.map(i => i.name).join(', ')
    let weeklyTip = ''
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{
            text: `Dato questo frigo: ${inventoryList || 'vuoto'}. Dai UN consiglio pratico per la prossima settimana (menu planning, conservazione, o anti-spreco). Max 2 frasi, in italiano.`,
          }],
        }],
      })
      weeklyTip = result.text?.trim() || ''
    } catch {
      // Skip tip if Gemini fails
    }

    // Build summary
    const memberNames = members.map(m => m.full_name?.split(' ')[0] || '').filter(Boolean).join(', ')

    let summary = `📊 *Report settimanale — Kitchen Steward*\n\n`
    summary += `👨‍👩‍👧 Famiglia: ${memberNames}\n\n`
    summary += `🧊 *Frigo:* ${totalItems} prodotti`
    if (addedThisWeek > 0) summary += ` (+${addedThisWeek} questa settimana)`
    summary += '\n'
    if (expired > 0) summary += `🔴 ${expired} prodotti scaduti — controllali!\n`
    if (expiringSoon > 0) summary += `🟡 ${expiringSoon} in scadenza nei prossimi 3 giorni\n`
    if (expired === 0 && expiringSoon === 0) summary += `✅ Nessuna scadenza urgente!\n`

    summary += `\n🛒 *Spesa:* ${shoppingTotal} articoli`
    if (shoppingChecked > 0) summary += ` (${shoppingChecked} completati)`
    summary += '\n'

    if (weeklyTip) {
      summary += `\n💡 *Consiglio della settimana:*\n${weeklyTip}\n`
    }

    summary += `\n⬇️ *Scegli:*\n1️⃣ Genera spesa per la settimana\n2️⃣ Suggeriscimi un menu\n3️⃣ Mostra il frigo`

    // Send to all household members
    for (const member of members) {
      const ok = await sendWhatsApp(member.whatsapp_number, summary)
      if (ok) sent++
    }
  }

  return NextResponse.json({ message: 'Weekly summaries sent', sent })
}
