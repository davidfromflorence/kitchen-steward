import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'
import {
  parseWhatsAppNumber,
  buildTwiMLResponse,
  formatInventoryList,
} from '@/lib/whatsapp'

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function twiml(message: string) {
  const truncated = message.length > 1500
    ? message.substring(0, 1480) + '\n\n_(troncato)_'
    : message
  return new Response(buildTwiMLResponse(truncated), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

function twilioAuth() {
  return 'Basic ' + Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
  ).toString('base64')
}

async function sendWhatsApp(phoneNumber: string, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: twilioAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      From: process.env.TWILIO_WHATSAPP_NUMBER!,
      To: `whatsapp:${phoneNumber}`,
      Body: message,
    }).toString(),
  })
}

// ---------------------------------------------------------------------------
// Fast intent detection (no AI, <1ms)
// ---------------------------------------------------------------------------

type FastIntent =
  | { type: 'greeting' }
  | { type: 'show_fridge' }
  | { type: 'show_expiring' }
  | { type: 'show_shopping' }
  | { type: 'help' }
  | { type: 'delete'; item: string }
  | { type: 'media_unsupported'; kind: string }
  | { type: 'ai_needed' }

function detectFastIntent(msg: string): FastIntent {
  const l = msg.toLowerCase().trim()

  // Greetings
  if (['ciao', 'hey', 'hi', 'hello', 'buongiorno', 'buonasera', 'salve', 'ehi'].includes(l)) {
    return { type: 'greeting' }
  }

  // Numbered quick replies
  if (l === '1') return { type: 'show_fridge' }
  if (l === '2') return { type: 'ai_needed' } // recipe — needs AI
  if (l === '3') return { type: 'ai_needed' } // shopping/plan — needs AI

  // Exact commands
  if (['lista', 'frigo', 'fridge'].includes(l)) return { type: 'show_fridge' }
  if (['scadenze', 'scade', 'expiring'].includes(l)) return { type: 'show_expiring' }
  if (['spesa', 'shopping', 'lista spesa'].includes(l)) return { type: 'show_shopping' }
  if (['aiuto', 'help', '?'].includes(l)) return { type: 'help' }

  // Keyword patterns (no AI needed)
  if (/cosa (c'è|c'e|abbiamo|hai|c è).*frig/i.test(l)) return { type: 'show_fridge' }
  if (/mostr.*frig|fammi.*frig|vedi.*frig|apri.*frig/i.test(l)) return { type: 'show_fridge' }
  if (/cosa.*scad|sta.*per.*scad|scadenz/i.test(l)) return { type: 'show_expiring' }
  if (/elimina\s+(.+)/i.test(l)) return { type: 'delete', item: l.replace(/elimina\s+/i, '').trim() }
  if (/togli\s+(.+)/i.test(l)) return { type: 'delete', item: l.replace(/togli\s+/i, '').trim() }
  if (/rimuovi\s+(.+)/i.test(l)) return { type: 'delete', item: l.replace(/rimuovi\s+/i, '').trim() }
  if (/finit[oa]\s+(il |la |lo |l'|i |le |gli )?(.+)/i.test(l)) {
    const m = l.match(/finit[oa]\s+(?:il |la |lo |l'|i |le |gli )?(.+)/i)
    return { type: 'delete', item: m?.[1]?.trim() || '' }
  }

  // Everything else needs AI
  return { type: 'ai_needed' }
}

// ---------------------------------------------------------------------------
// Fast handlers (no Gemini, <2s total)
// ---------------------------------------------------------------------------

const MENU_DEFAULT = '\n\n⬇️ *Scegli:*\n1️⃣ Mostra il frigo\n2️⃣ Suggeriscimi una ricetta\n3️⃣ Pianifica i pasti della settimana'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleGreeting(supabase: any, householdId: string, userId: string): Promise<string> {
  const [profileRes, itemsRes] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', userId).single(),
    supabase.from('inventory_items').select('expiry_date').eq('household_id', householdId),
  ])

  const name = profileRes.data?.full_name?.split(' ')[0] || 'Ciao'
  const items = itemsRes.data || []
  const total = items.length
  const expiring = items.filter((i: { expiry_date: string | null }) => {
    if (!i.expiry_date) return false
    const d = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86_400_000)
    return d >= 0 && d <= 3
  }).length

  let status = total === 0
    ? '📦 Il frigo è vuoto — aggiungimi cosa hai comprato!'
    : `🧊 Hai *${total} prodotti* nel frigo`
  if (expiring > 0) status += ` — ⚠️ *${expiring}* in scadenza!`

  return `👋 Ciao *${name}*!\n\n${status}${MENU_DEFAULT}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleShowFridge(supabase: any, householdId: string): Promise<string> {
  const { data } = await supabase
    .from('inventory_items')
    .select('name, quantity, unit, category, expiry_date')
    .eq('household_id', householdId)
    .order('expiry_date', { ascending: true, nullsFirst: false })

  return formatInventoryList(data || []) + '\n\n⬇️ *Scegli:*\n1️⃣ Cosa cucino?\n2️⃣ Cosa sta per scadere?\n3️⃣ Genera la lista spesa'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleExpiring(supabase: any, householdId: string): Promise<string> {
  const threeDays = new Date(Date.now() + 3 * 86_400_000).toISOString().split('T')[0]
  const { data } = await supabase
    .from('inventory_items')
    .select('name, quantity, unit, expiry_date')
    .eq('household_id', householdId)
    .lte('expiry_date', threeDays)
    .order('expiry_date', { ascending: true })

  if (!data || data.length === 0) {
    return '✅ Nessun prodotto in scadenza nei prossimi 3 giorni!' + MENU_DEFAULT
  }

  const lines = data.map((i: { name: string; quantity: number; unit: string; expiry_date: string }) => {
    const d = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86_400_000)
    const emoji = d <= 0 ? '🔴' : d === 1 ? '🟠' : '🟡'
    const label = d <= 0 ? 'SCADUTO' : d === 1 ? 'domani' : `tra ${d}g`
    return `${emoji} ${i.quantity} ${i.unit} ${i.name} — ${label}`
  })

  return `⏰ *Prodotti in scadenza*\n\n${lines.join('\n')}\n\n⬇️ *Scegli:*\n1️⃣ Ricetta con questi\n2️⃣ Mostra il frigo\n3️⃣ Genera la lista spesa`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleShowShopping(supabase: any, householdId: string): Promise<string> {
  const { data } = await supabase
    .from('shopping_list_items')
    .select('name, checked')
    .eq('household_id', householdId)
    .order('checked', { ascending: true })

  if (!data || data.length === 0) {
    return '🛒 La lista della spesa è vuota!\n\nScrivi "genera la spesa" per creare una lista dal frigo.' + MENU_DEFAULT
  }

  const unchecked = data.filter((i: { checked: boolean }) => !i.checked)
  const checked = data.filter((i: { checked: boolean }) => i.checked)

  let msg = '🛒 *Lista della spesa*\n\n'
  if (unchecked.length > 0) {
    msg += unchecked.map((i: { name: string }) => `☐ ${i.name}`).join('\n')
    msg += '\n\n📋 _Copia su Google Keep / Apple Notes!_'
  }
  if (checked.length > 0) {
    msg += `\n\n✅ *Presi (${checked.length}):* ` + checked.map((i: { name: string }) => i.name).join(', ')
  }

  return msg + MENU_DEFAULT
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDelete(supabase: any, householdId: string, itemName: string): Promise<string> {
  if (!itemName) return 'Dimmi cosa vuoi togliere. Es: "elimina latte"' + MENU_DEFAULT

  const { data } = await supabase
    .from('inventory_items')
    .select('id, name, quantity, unit')
    .eq('household_id', householdId)
    .ilike('name', `%${itemName}%`)

  if (!data || data.length === 0) {
    return `Non ho trovato "${itemName}" nel frigo.` + MENU_DEFAULT
  }

  const ids = data.map((i: { id: string }) => i.id)
  await supabase.from('inventory_items').delete().in('id', ids)

  if (data.length === 1) {
    return `🗑️ Rimosso: ${data[0].quantity} ${data[0].unit} ${data[0].name}\n\n⬇️ *Scegli:*\n1️⃣ Mostra il frigo\n2️⃣ Cosa cucino?\n3️⃣ Genera la spesa`
  }
  const lines = data.map((i: { name: string; quantity: number; unit: string }) => `  • ${i.quantity} ${i.unit} ${i.name}`)
  return `🗑️ Rimossi ${data.length} prodotti:\n${lines.join('\n')}\n\n⬇️ *Scegli:*\n1️⃣ Mostra il frigo\n2️⃣ Cosa cucino?\n3️⃣ Genera la spesa`
}

const HELP_TEXT = `🍳 *Kitchen Steward*

Parla con me in modo naturale!

🧊 *Frigo* — "Cosa c'è nel frigo?"
⏰ *Scadenze* — "Cosa scade?"
🍽️ *Ricette* — "Cosa cucino stasera?"
🛒 *Spesa* — "Genera la lista della spesa"
📋 *Pianifica* — "Pianifica i pasti della settimana"
🗑️ *Rimuovi* — "Ho finito il latte"
💡 *Curiosità* — "Dimmi una curiosità"
➕ *Aggiungi* — "Ho comprato pollo, uova e latte"

📋 La spesa è formattata per Google Keep / Apple Notes!` + MENU_DEFAULT

// ---------------------------------------------------------------------------
// AI handler (Gemini, for complex requests only)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleWithAI(supabase: any, householdId: string, userId: string, message: string): Promise<string> {
  // Lightweight context — only what AI needs
  const [profileRes, inventoryRes] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', userId).single(),
    supabase.from('inventory_items').select('name, quantity, unit, category, expiry_date').eq('household_id', householdId).order('expiry_date', { ascending: true, nullsFirst: false }),
  ])

  const items = inventoryRes.data || []
  const userName = profileRes.data?.full_name?.split(' ')[0] || 'amico'
  const now = Date.now()

  const fridgeLines = items.map((i: { name: string; quantity: number; unit: string; expiry_date: string | null }) => {
    const exp = i.expiry_date ? ` [${Math.ceil((new Date(i.expiry_date).getTime() - now) / 86_400_000)}g]` : ''
    return `${i.quantity}${i.unit} ${i.name}${exp}`
  }).join(', ')

  const prompt = `Sei Kitchen Steward, assistente cucina italiano su WhatsApp. Utente: ${userName}. Frigo: ${fridgeLines || 'vuoto'}.

Regole: italiano, conciso, emoji, formattazione WhatsApp (*grassetto*).
Per liste spesa usa ☐ per ogni riga (copiabili su Google Keep).
Per RICETTE: proponi SEMPRE 3 opzioni brevi (nome + tempo + 1 riga descrizione), numerate 1️⃣ 2️⃣ 3️⃣. L'utente sceglie il numero e tu rispondi con la ricetta completa (ingredienti, passi max 5, tip anti-spreco). Se l'utente dice un numero dopo una proposta di ricette, mostra quella ricetta completa.
Per meal plan: Lun-Dom con pranzo e cena.

AZIONI: se l'utente aggiunge prodotti, rispondi con:
<<<ADD_ITEMS>>>[{"name":"...","qty":N,"unit":"pz|kg|g|litri|ml","estimated_expiry_days":N,"category":"Protein|Vegetable|Fruit|Dairy|Carbohydrate|Condiment|General"}]<<<END>>>

Se genera spesa, salva con:
<<<SAVE_SHOPPING>>>[{"name":"...","category":"General"}]<<<END>>>

SEMPRE termina con:
⬇️ *Scegli:*
1️⃣ [opzione]
2️⃣ [opzione]
3️⃣ [opzione]

Messaggio utente: ${message}`

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })

  let reply = result.text?.trim() || 'Scusa, non ho capito. Riprova!'

  // Process ADD_ITEMS
  const addMatch = reply.match(/<<<ADD_ITEMS>>>([\s\S]*?)<<<END>>>/)
  if (addMatch) {
    try {
      const parsed = JSON.parse(addMatch[1])
      if (Array.isArray(parsed) && parsed.length > 0) {
        const { calculateExpiryDate: calcExpiry, defaultZone: defZone } = await import('@/lib/shelf-life')
        const rows = parsed.map((item: { name: string; qty: number; unit: string; category?: string }) => {
          const category = item.category || 'General'
          const zone = defZone(category)
          return {
            household_id: householdId,
            name: item.name,
            quantity: item.qty || 1,
            unit: item.unit || 'pz',
            category,
            zone,
            expiry_date: calcExpiry(item.name, category, zone),
          }
        })
        await supabase.from('inventory_items').insert(rows)

        // Notify family
        const itemNames = parsed.map((i: { name: string }) => i.name).join(', ')
        notifyFamily(supabase, householdId, userId, `🛒 ${userName} ha aggiunto: ${itemNames}`)
      }
    } catch (e) {
      console.error('ADD_ITEMS error:', e)
    }
    reply = reply.replace(/<<<ADD_ITEMS>>>[\s\S]*?<<<END>>>/g, '').trim()
  }

  // Process SAVE_SHOPPING
  const shopMatch = reply.match(/<<<SAVE_SHOPPING>>>([\s\S]*?)<<<END>>>/)
  if (shopMatch) {
    try {
      const parsed: Array<{ name: string; category: string }> = JSON.parse(shopMatch[1])
      if (parsed.length > 0) {
        const { data: existing } = await supabase
          .from('shopping_list_items').select('name').eq('household_id', householdId).eq('checked', false)
        const existingNames = new Set((existing || []).map((i: { name: string }) => i.name.toLowerCase()))
        const newItems = parsed
          .filter(i => !existingNames.has(i.name.toLowerCase()))
          .map(i => ({ household_id: householdId, name: i.name, category: i.category || 'General', checked: false }))
        if (newItems.length > 0) await supabase.from('shopping_list_items').insert(newItems)
      }
    } catch (e) {
      console.error('SAVE_SHOPPING error:', e)
    }
    reply = reply.replace(/<<<SAVE_SHOPPING>>>[\s\S]*?<<<END>>>/g, '').trim()
  }

  return reply.replace(/\n{3,}/g, '\n\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notifyFamily(supabase: any, householdId: string, excludeUserId: string, message: string) {
  // Fire and forget
  supabase
    .from('users')
    .select('whatsapp_number')
    .eq('household_id', householdId)
    .not('id', 'eq', excludeUserId)
    .not('whatsapp_number', 'is', null)
    .then(({ data }: { data: Array<{ whatsapp_number: string }> | null }) => {
      if (!data) return
      for (const m of data) sendWhatsApp(m.whatsapp_number, message)
    })
    .catch(() => {})
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

export async function GET() {
  return new NextResponse('OK', { status: 200 })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const body = (formData.get('Body') as string | null)?.trim() ?? ''
    const from = (formData.get('From') as string | null) ?? ''
    const numMedia = parseInt((formData.get('NumMedia') as string) || '0', 10)

    const phoneNumber = parseWhatsAppNumber(from)
    const supabase = getSupabaseAdmin()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, household_id')
      .eq('whatsapp_number', phoneNumber)
      .single()

    if (userError || !user) {
      return twiml('Non ho trovato il tuo account. Collega il tuo numero WhatsApp nelle impostazioni di Kitchen Steward.')
    }
    if (!user.household_id) {
      return twiml('Completa la configurazione su Kitchen Steward prima di usare la chat.')
    }

    // Media — instant response (free plan can't process in time)
    if (numMedia > 0) {
      const mediaType = (formData.get('MediaContentType0') as string) || ''
      if (mediaType.startsWith('audio/')) {
        return twiml('🎤 I vocali non sono ancora supportati. Scrivimi il messaggio!' + MENU_DEFAULT)
      }
      if (mediaType.startsWith('image/')) {
        return twiml('📷 Le foto non sono ancora supportate. Scrivimi cosa hai comprato!' + MENU_DEFAULT)
      }
    }

    if (!body) return twiml('Scrivimi qualcosa!' + MENU_DEFAULT)

    // Fast path — no Gemini needed (~1-2s)
    const intent = detectFastIntent(body)

    switch (intent.type) {
      case 'greeting':
        return twiml(await handleGreeting(supabase, user.household_id, user.id))
      case 'show_fridge':
        return twiml(await handleShowFridge(supabase, user.household_id))
      case 'show_expiring':
        return twiml(await handleExpiring(supabase, user.household_id))
      case 'show_shopping':
        return twiml(await handleShowShopping(supabase, user.household_id))
      case 'delete':
        return twiml(await handleDelete(supabase, user.household_id, intent.item))
      case 'help':
        return twiml(HELP_TEXT)
      case 'ai_needed':
        // Slow path — Gemini (~5-8s)
        return twiml(await handleWithAI(supabase, user.household_id, user.id, body))
    }
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return twiml('Si è verificato un errore. Riprova tra qualche istante.')
  }
}
