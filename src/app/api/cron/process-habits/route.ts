import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
  await fetch(url, {
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
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon...

  // Get all active habits
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('active', true)

  if (!habits || habits.length === 0) {
    return NextResponse.json({ message: 'No habits to process', processed: 0 })
  }

  // Unit conversion table — everything normalized to a base unit
  const unitToBase: Record<string, { base: string; factor: number }> = {
    'ml': { base: 'ml', factor: 1 },
    'litri': { base: 'ml', factor: 1000 },
    'l': { base: 'ml', factor: 1000 },
    'g': { base: 'g', factor: 1 },
    'kg': { base: 'g', factor: 1000 },
    'pz': { base: 'pz', factor: 1 },
    'scatole': { base: 'pz', factor: 1 },
  }

  function convertToBase(qty: number, unit: string): { qty: number; base: string } | null {
    const conv = unitToBase[unit.toLowerCase()]
    if (!conv) return null
    return { qty: qty * conv.factor, base: conv.base }
  }

  function convertFromBase(qty: number, unit: string): number {
    const conv = unitToBase[unit.toLowerCase()]
    if (!conv) return qty
    return qty / conv.factor
  }

  let processed = 0

  for (const habit of habits) {
    // Check if already processed today
    if (habit.last_processed_at?.startsWith(today)) continue

    // Check frequency
    const shouldProcess =
      habit.frequency === 'daily' ||
      habit.frequency === 'twice_daily' ||
      (habit.frequency === 'weekly' && dayOfWeek === 1) // Process weekly on Mondays

    if (!shouldProcess) continue

    const items = habit.items as Array<{ name: string; qty: number; unit: string }>
    const multiplier = habit.frequency === 'twice_daily' ? 2 : habit.times_per_period || 1

    // Get household inventory
    const { data: inventory } = await supabase
      .from('inventory_items')
      .select('id, name, quantity, unit')
      .eq('household_id', habit.household_id)
      .order('expiry_date', { ascending: true })

    if (!inventory) continue

    const subtracted: string[] = []
    const outOfStock: string[] = []

    for (const item of items) {
      const totalSubtract = item.qty * multiplier

      // Find matching inventory item
      const match = inventory.find(inv => {
        const invLower = inv.name.toLowerCase()
        const itemLower = item.name.toLowerCase()
        return invLower.includes(itemLower) || itemLower.includes(invLower)
      })

      if (!match) {
        outOfStock.push(item.name)
        continue
      }

      // Convert both to base units and check compatibility
      const habitBase = convertToBase(totalSubtract, item.unit)
      const invBase = convertToBase(Number(match.quantity), match.unit)

      if (!habitBase || !invBase || habitBase.base !== invBase.base) {
        // Units are incompatible (e.g. subtracting ml from pz) — skip, don't destroy data
        console.log(`[HABITS] Skipping ${item.name}: incompatible units (habit: ${item.unit}, inventory: ${match.unit})`)
        subtracted.push(`${match.name} (unità diverse, non sottratto)`)
        continue
      }

      const newBaseQty = invBase.qty - habitBase.qty
      const newQty = convertFromBase(newBaseQty, match.unit)

      if (newQty <= 0) {
        await supabase.from('inventory_items').delete().eq('id', match.id)
        subtracted.push(`${match.name} (finito!)`)
        outOfStock.push(match.name) // Will need to buy more
      } else {
        const rounded = Math.round(newQty * 100) / 100
        await supabase.from('inventory_items').update({ quantity: rounded }).eq('id', match.id)
        subtracted.push(`${match.name} -${totalSubtract}${item.unit}`)
      }
    }

    // Mark as processed
    await supabase.from('habits').update({ last_processed_at: now.toISOString() }).eq('id', habit.id)

    // Send WhatsApp confirmation to the user
    const { data: user } = await supabase
      .from('users')
      .select('whatsapp_number, full_name')
      .eq('id', habit.user_id)
      .single()

    if (user?.whatsapp_number) {
      const firstName = user.full_name?.split(' ')[0] || ''
      let msg = `🔄 *Abitudine: ${habit.description}*\n\n`

      if (subtracted.length > 0) {
        msg += `Aggiornato il frigo:\n${subtracted.map(s => `  📉 ${s}`).join('\n')}\n`
      }

      if (outOfStock.length > 0) {
        msg += `\n⚠️ *Da comprare:* ${outOfStock.join(', ')}\n`
      }

      msg += `\n⬇️ *Scegli:*\n1️⃣ Mostra il frigo\n2️⃣ Genera la spesa\n3️⃣ Pausa questa abitudine`

      await sendWhatsApp(user.whatsapp_number, msg)
    }

    processed++
  }

  return NextResponse.json({ message: 'Habits processed', processed })
}
