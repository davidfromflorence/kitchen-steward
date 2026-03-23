import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: twilioNumber,
      To: `whatsapp:${phoneNumber}`,
      Body: message,
    }).toString(),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error(`Failed to send to ${phoneNumber}:`, err)
    return false
  }
  return true
}

function getMealType(): 'lunch' | 'dinner' {
  // Vercel cron runs in UTC — Italy is UTC+1 (winter) / UTC+2 (summer)
  // We schedule lunch check at 14:00 CET and dinner at 21:00 CET
  // The cron times in vercel.json handle the UTC offset
  const hour = new Date().getUTCHours()
  return hour < 18 ? 'lunch' : 'dinner'
}

// ---------------------------------------------------------------------------
// GET — called by Vercel Cron after lunch (14:00 CET) and dinner (21:00 CET)
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const meal = getMealType()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, whatsapp_number, household_id, full_name')
    .not('whatsapp_number', 'is', null)
    .not('household_id', 'is', null)

  if (error || !users || users.length === 0) {
    return NextResponse.json({ message: 'No users to notify', sent: 0 })
  }

  let sent = 0
  const mealLabel = meal === 'lunch' ? 'pranzo' : 'cena'
  const emoji = meal === 'lunch' ? '🍝' : '🍽️'

  // Get some expiring items to suggest
  const householdsChecked = new Set<string>()

  for (const user of users) {
    const firstName = user.full_name?.split(' ')[0] || ''

    let expiringHint = ''
    if (!householdsChecked.has(user.household_id)) {
      householdsChecked.add(user.household_id)
      const twoDays = new Date(Date.now() + 2 * 86_400_000).toISOString().split('T')[0]
      const { data: expiring } = await supabase
        .from('inventory_items')
        .select('name')
        .eq('household_id', user.household_id)
        .lte('expiry_date', twoDays)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .limit(3)

      if (expiring && expiring.length > 0) {
        const names = expiring.map((i: { name: string }) => i.name).join(', ')
        expiringHint = `\n\n💡 _Da usare presto: ${names}_`
      }
    }

    const message = `${emoji} *${firstName}*, cosa hai mangiato a ${mealLabel}?

Rispondimi e aggiorno il frigo!
Es: "pasta al pesto", "insalata di pollo", "ho mangiato fuori"${expiringHint}`

    const ok = await sendWhatsApp(user.whatsapp_number, message)
    if (ok) {
      sent++
      // Save context so the webhook knows the next reply is a meal answer
      await supabase
        .from('users')
        .update({ pending_meal_checkin: mealLabel })
        .eq('id', user.id)
    }
  }

  return NextResponse.json({ message: `${mealLabel} check-in sent`, sent })
}
