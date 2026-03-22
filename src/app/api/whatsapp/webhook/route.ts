import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'
import {
  parseWhatsAppNumber,
  buildTwiMLResponse,
  formatInventoryList,
} from '@/lib/whatsapp'
import { rateLimit } from '@/lib/rate-limit'

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
// Conversation memory (in-memory, per-phone, last 5 messages)
// ---------------------------------------------------------------------------

interface ConversationEntry {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

const conversations = new Map<string, ConversationEntry[]>()
const MEMORY_TTL = 15 * 60 * 1000 // 15 minutes
const MAX_HISTORY = 6 // 3 exchanges

function getHistory(phone: string): ConversationEntry[] {
  const history = conversations.get(phone) || []
  const cutoff = Date.now() - MEMORY_TTL
  return history.filter((e) => e.ts > cutoff)
}

function addToHistory(phone: string, role: 'user' | 'assistant', content: string) {
  const history = getHistory(phone)
  history.push({ role, content, ts: Date.now() })
  // Keep only last MAX_HISTORY entries
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY)
  conversations.set(phone, history)
}

// Cleanup old conversations periodically
setInterval(() => {
  const cutoff = Date.now() - MEMORY_TTL
  for (const [key, entries] of conversations) {
    if (entries.every((e) => e.ts < cutoff)) conversations.delete(key)
  }
}, 5 * 60 * 1000)

// ---------------------------------------------------------------------------
// Time context
// ---------------------------------------------------------------------------

function getMealContext(): string {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 10) return 'colazione'
  if (hour >= 10 && hour < 14) return 'pranzo'
  if (hour >= 14 && hour < 17) return 'merenda'
  if (hour >= 17 && hour < 22) return 'cena'
  return 'spuntino notturno'
}

function getItalianDate(): string {
  return new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
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
  | { type: 'ate_out' }
  | { type: 'media_unsupported'; kind: string }
  | { type: 'ai_needed' }

function detectFastIntent(msg: string): FastIntent {
  const l = msg.toLowerCase().trim()

  // Greetings
  if (['ciao', 'hey', 'hi', 'hello', 'buongiorno', 'buonasera', 'salve', 'ehi'].includes(l)) {
    return { type: 'greeting' }
  }

  // Numbered quick replies — these are contextual, let AI handle with history
  if (/^[1-3]$/.test(l)) return { type: 'ai_needed' }

  // Exact commands
  if (['lista', 'frigo', 'fridge'].includes(l)) return { type: 'show_fridge' }
  if (['scadenze', 'scade', 'expiring'].includes(l)) return { type: 'show_expiring' }
  if (['spesa', 'shopping', 'lista spesa'].includes(l)) return { type: 'show_shopping' }
  if (['aiuto', 'help', '?'].includes(l)) return { type: 'help' }

  // Ate out — no subtraction needed
  if (/mangiato?\s+fuori|ho\s+(pranzato|cenato)\s+fuori|(siamo|sono)\s+\w*\s*(andat[oi]|uscit[oi]).*mangiare|ristorante|pizzeria|mangiato?\s+(al|in)\s+/i.test(l)) {
    return { type: 'ate_out' }
  }
  if (['fuori', 'mangiato fuori', 'ho mangiato fuori', 'pranzato fuori', 'cenato fuori'].includes(l)) {
    return { type: 'ate_out' }
  }

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

  const meal = getMealContext()
  const greeting = meal === 'colazione' ? 'Buongiorno' : meal === 'cena' ? 'Buonasera' : 'Ciao'

  let status = total === 0
    ? '📦 Il frigo è vuoto — dimmi cosa hai comprato!'
    : `🧊 Hai *${total} prodotti* nel frigo`
  if (expiring > 0) status += ` — ⚠️ *${expiring}* in scadenza!`

  const tip = expiring > 0
    ? `\n\n💡 Vuoi una ricetta per usare i prodotti in scadenza?`
    : meal === 'pranzo' || meal === 'cena'
      ? `\n\n💡 È ora di ${meal} — vuoi un suggerimento?`
      : ''

  return `${greeting} *${name}*! 👋\n\n${status}${tip}${MENU_DEFAULT}`
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

  return `⏰ *Prodotti in scadenza*\n\n${lines.join('\n')}\n\n💡 _Vuoi una ricetta per usarli?_\n\n⬇️ *Scegli:*\n1️⃣ Ricetta con questi\n2️⃣ Mostra il frigo\n3️⃣ Genera la lista spesa`
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

Parlami come parleresti a un amico!

🧊 *Frigo* — "Cosa c'è nel frigo?"
⏰ *Scadenze* — "Cosa scade?"
🍽️ *Ricette* — "Cosa cucino stasera?"
🛒 *Spesa* — "Genera la lista della spesa"
📋 *Pianifica* — "Pianifica i pasti della settimana"
🗑️ *Rimuovi* — "Ho finito il latte"
➕ *Aggiungi* — "Ho comprato pollo, uova e latte"
🍝 *Ho mangiato* — "Ho mangiato pasta al pesto"
🍕 *Fuori* — "Ho mangiato fuori" (non tolgo nulla)
📅 *Scadenza* — "Il latte scade venerdì"

💡 Ti chiederò dopo pranzo e cena cosa hai mangiato, così aggiorno il frigo!
💡 Ricordo la conversazione — puoi dire "la 2" dopo che ti propongo delle ricette!` + MENU_DEFAULT

// ---------------------------------------------------------------------------
// AI handler (Gemini, with conversation history)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleWithAI(supabase: any, householdId: string, userId: string, message: string, phone: string): Promise<string> {
  const [profileRes, inventoryRes, shoppingRes] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', userId).single(),
    supabase.from('inventory_items').select('name, quantity, unit, category, expiry_date').eq('household_id', householdId).order('expiry_date', { ascending: true, nullsFirst: false }),
    supabase.from('shopping_list_items').select('name').eq('household_id', householdId).eq('checked', false).limit(20),
  ])

  const items = inventoryRes.data || []
  const userName = profileRes.data?.full_name?.split(' ')[0] || 'amico'
  const shoppingItems = (shoppingRes.data || []).map((i: { name: string }) => i.name)
  const now = Date.now()
  const meal = getMealContext()
  const today = getItalianDate()

  // Build fridge context with days-to-expiry
  const fridgeLines = items.map((i: { name: string; quantity: number; unit: string; expiry_date: string | null; category: string }) => {
    const days = i.expiry_date ? Math.ceil((new Date(i.expiry_date).getTime() - now) / 86_400_000) : null
    const exp = days !== null ? (days <= 0 ? ' ⚠️SCADUTO' : days <= 2 ? ` ⚠️${days}g` : ` [${days}g]`) : ''
    return `- ${i.quantity}${i.unit} ${i.name} (${i.category})${exp}`
  }).join('\n')

  // Build conversation history for context
  const history = getHistory(phone)
  const historyText = history.length > 0
    ? '\n\nCONVERSAZIONE RECENTE:\n' + history.map((e) =>
        `${e.role === 'user' ? 'UTENTE' : 'TU'}: ${e.content.substring(0, 200)}`
      ).join('\n')
    : ''

  const prompt = `Sei Kitchen Steward, un assistente cucina amichevole e intelligente su WhatsApp.

CONTESTO:
- Utente: ${userName}
- Data: ${today}
- Momento della giornata: ${meal}
- Lista spesa attuale: ${shoppingItems.length > 0 ? shoppingItems.join(', ') : 'vuota'}
${historyText}

FRIGO (${items.length} prodotti):
${fridgeLines || '(vuoto)'}

PERSONALITÀ:
- Parli italiano, sei conciso e amichevole
- Usi emoji con moderazione (non ogni riga)
- Formattazione WhatsApp: *grassetto*, _corsivo_
- Sei proattivo: se vedi prodotti in scadenza, suggerisci come usarli
- Conosci la cucina italiana e le porzioni tipiche
- Se è ora di ${meal}, adatti i suggerimenti al momento

RISPOSTE AI NUMERI:
Se l'utente scrive "1", "2", "3" o "la 1", "la 2", "la seconda", guarda la conversazione recente e rispondi alla scelta corrispondente. Se avevi proposto 3 ricette, dai la ricetta completa di quella scelta.

AZIONI DATABASE:

Se l'utente AGGIUNGE prodotti (ha comprato, aggiungi, ho preso...):
<<<ADD_ITEMS>>>[{"name":"...","qty":N,"unit":"pz|kg|g|litri|ml","category":"Protein|Vegetable|Fruit|Dairy|Carbohydrate|Condiment|General"}]<<<END>>>

Se l'utente ha MANGIATO/CUCINATO/USATO qualcosa A CASA:
<<<USE_ITEMS>>>[{"name":"nome ESATTO dal frigo","qty_subtract":N,"unit":"stessa unit del frigo"}]<<<END>>>
IMPORTANTE: il "name" deve corrispondere ESATTAMENTE a un prodotto nel frigo. Porzioni italiane: pasta ~80g, riso ~80g, pesto ~30g, pollo ~150g, uova 2pz, mozzarella 125g, verdure ~150g.

Se l'utente dice "ho mangiato fuori", "pranzato fuori", "ristorante", "pizzeria", etc.: NON usare USE_ITEMS, NON sottrarre nulla. Rispondi con un messaggio amichevole tipo "Ok, buon appetito!".

Se CAMBIA SCADENZA:
<<<UPDATE_EXPIRY>>>[{"name":"nome ESATTO dal frigo","new_date":"YYYY-MM-DD"}]<<<END>>>

Se GENERA SPESA:
<<<SAVE_SHOPPING>>>[{"name":"...","category":"General"}]<<<END>>>

RICETTE:
- Proponi SEMPRE 3 opzioni: nome + tempo + 1 riga
- Numerate 1️⃣ 2️⃣ 3️⃣
- Prioritizza ingredienti in scadenza
- Quando l'utente sceglie, dai: ingredienti dal frigo, passi (max 5), tip anti-spreco

TERMINA SEMPRE con opzioni contestuali:
⬇️ *Scegli:*
1️⃣ [opzione rilevante]
2️⃣ [opzione rilevante]
3️⃣ [opzione rilevante]

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

  // Process USE_ITEMS
  const useMatch = reply.match(/<<<USE_ITEMS>>>([\s\S]*?)<<<END>>>/)
  if (useMatch) {
    try {
      const parsed: Array<{ name: string; qty_subtract: number; unit: string }> = JSON.parse(useMatch[1])
      for (const used of parsed) {
        // Exact match first, then fuzzy
        let { data: matches } = await supabase
          .from('inventory_items')
          .select('id, name, quantity, unit')
          .eq('household_id', householdId)
          .ilike('name', used.name)
          .order('expiry_date', { ascending: true })
          .limit(1)

        if (!matches || matches.length === 0) {
          // Fuzzy fallback
          const result = await supabase
            .from('inventory_items')
            .select('id, name, quantity, unit')
            .eq('household_id', householdId)
            .ilike('name', `%${used.name}%`)
            .order('expiry_date', { ascending: true })
            .limit(1)
          matches = result.data
        }

        if (matches && matches.length > 0) {
          const item = matches[0]
          const newQty = item.quantity - used.qty_subtract
          if (newQty <= 0) {
            await supabase.from('inventory_items').delete().eq('id', item.id)
          } else {
            await supabase.from('inventory_items').update({ quantity: newQty }).eq('id', item.id)
          }
        }
      }
    } catch (e) {
      console.error('USE_ITEMS error:', e)
    }
    reply = reply.replace(/<<<USE_ITEMS>>>[\s\S]*?<<<END>>>/g, '').trim()
  }

  // Process UPDATE_EXPIRY
  const expiryMatch = reply.match(/<<<UPDATE_EXPIRY>>>([\s\S]*?)<<<END>>>/)
  if (expiryMatch) {
    try {
      const parsed: Array<{ name: string; new_date: string }> = JSON.parse(expiryMatch[1])
      for (const item of parsed) {
        const { data: matches } = await supabase
          .from('inventory_items')
          .select('id')
          .eq('household_id', householdId)
          .ilike('name', `%${item.name}%`)
          .limit(1)
        if (matches && matches.length > 0) {
          await supabase.from('inventory_items').update({ expiry_date: item.new_date }).eq('id', matches[0].id)
        }
      }
    } catch (e) {
      console.error('UPDATE_EXPIRY error:', e)
    }
    reply = reply.replace(/<<<UPDATE_EXPIRY>>>[\s\S]*?<<<END>>>/g, '').trim()
  }

  return reply.replace(/\n{3,}/g, '\n\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notifyFamily(supabase: any, householdId: string, excludeUserId: string, message: string) {
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

    // Rate limit: 20 messages per minute per phone number
    const { success: withinLimit } = rateLimit(`wa:${from}`, { limit: 20, windowMs: 60_000 })
    if (!withinLimit) {
      return twiml('Stai inviando troppi messaggi. Riprova tra un minuto.')
    }
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

    // Media handling
    if (numMedia > 0) {
      const mediaType = (formData.get('MediaContentType0') as string) || ''
      if (mediaType.startsWith('audio/')) {
        return twiml('🎤 I vocali non sono ancora supportati. Scrivimi il messaggio!' + MENU_DEFAULT)
      }
      if (mediaType.startsWith('image/')) {
        const mediaUrl = formData.get('MediaUrl0') as string
        if (mediaUrl) {
          try {
            // Download image from Twilio
            const imgRes = await fetch(mediaUrl, {
              headers: { Authorization: twilioAuth() },
            })
            const imgBuffer = await imgRes.arrayBuffer()
            const imgBase64 = Buffer.from(imgBuffer).toString('base64')

            // Extract items from receipt/photo using Gemini multimodal
            const extractResult = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: [{
                role: 'user',
                parts: [
                  { inlineData: { mimeType: mediaType, data: imgBase64 } },
                  { text: `Analizza questa foto. Se è uno scontrino o una lista della spesa, estrai TUTTI i prodotti alimentari acquistati.

Per ogni prodotto, stima:
- name: nome del prodotto in italiano (singolare, es. "Pollo" non "POLLO ARR.COSC S/O")
- qty: quantità (numero intero, default 1)
- unit: unità (pz, kg, g, litri, ml)
- category: una tra Protein, Vegetable, Fruit, Dairy, Carbohydrate, Condiment, General

IGNORA prodotti non alimentari (sacchetti, sconti, totali, IVA).

Rispondi SOLO con un JSON array valido. Se la foto non è uno scontrino/lista, rispondi con [].
Esempio: [{"name":"Pollo","qty":1,"unit":"kg","category":"Protein"}]` },
                ],
              }],
            })

            const raw = extractResult.text?.replace(/```json\n?|\n?```/g, '').trim() || '[]'
            const items: Array<{ name: string; qty: number; unit: string; category: string }> = JSON.parse(raw)

            if (items.length === 0) {
              return twiml('📷 Non ho trovato prodotti alimentari in questa foto. Prova con una foto più nitida dello scontrino!' + MENU_DEFAULT)
            }

            // Add items to fridge
            const { calculateExpiryDate: calcExpiry, defaultZone: defZone } = await import('@/lib/shelf-life')
            const rows = items.map((item) => {
              const category = item.category || 'General'
              const zone = defZone(category)
              return {
                household_id: user.household_id,
                name: item.name,
                quantity: item.qty || 1,
                unit: item.unit || 'pz',
                category,
                zone,
                expiry_date: calcExpiry(item.name, category, zone),
              }
            })
            await supabase.from('inventory_items').insert(rows)

            const userName = (await supabase.from('users').select('full_name').eq('id', user.id).single()).data?.full_name?.split(' ')[0] || ''
            const itemList = items.map((i) => `  • ${i.qty} ${i.unit} ${i.name}`).join('\n')
            const reply = `🧾 Scontrino letto! Ho aggiunto *${items.length} prodotti* al frigo:\n\n${itemList}\n\n✅ Tutto aggiornato, ${userName}!` + MENU_DEFAULT

            notifyFamily(supabase, user.household_id, user.id, `🛒 ${userName} ha aggiunto ${items.length} prodotti dallo scontrino`)
            addToHistory(phoneNumber, 'user', '[foto scontrino]')
            addToHistory(phoneNumber, 'assistant', reply)
            return twiml(reply)
          } catch (e) {
            console.error('Receipt scan error:', e)
            return twiml('📷 Non sono riuscito a leggere la foto. Prova con una più nitida o scrivimi cosa hai comprato!' + MENU_DEFAULT)
          }
        }
      }
    }

    if (!body) return twiml('Scrivimi qualcosa!' + MENU_DEFAULT)

    // Save user message to history
    addToHistory(phoneNumber, 'user', body)

    // Fast path — no Gemini needed (~1-2s)
    const intent = detectFastIntent(body)
    let reply: string

    switch (intent.type) {
      case 'greeting':
        reply = await handleGreeting(supabase, user.household_id, user.id)
        break
      case 'show_fridge':
        reply = await handleShowFridge(supabase, user.household_id)
        break
      case 'show_expiring':
        reply = await handleExpiring(supabase, user.household_id)
        break
      case 'show_shopping':
        reply = await handleShowShopping(supabase, user.household_id)
        break
      case 'delete':
        reply = await handleDelete(supabase, user.household_id, intent.item)
        break
      case 'ate_out': {
        const name = (await supabase.from('users').select('full_name').eq('id', user.id).single()).data?.full_name?.split(' ')[0] || ''
        reply = `🍕 Ok ${name}, mangiato fuori! Non tolgo nulla dal frigo.\n\nBuon appetito! 😊` + MENU_DEFAULT
        break
      }
      case 'help':
        reply = HELP_TEXT
        break
      case 'ai_needed':
        reply = await handleWithAI(supabase, user.household_id, user.id, body, phoneNumber)
        break
      default:
        reply = 'Non ho capito. Scrivi "aiuto" per le istruzioni.'
    }

    // Save bot reply to history
    addToHistory(phoneNumber, 'assistant', reply)

    return twiml(reply)
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return twiml('Si è verificato un errore. Riprova tra qualche istante.')
  }
}
