import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'
import {
  parseWhatsAppNumber,
  buildTwiMLResponse,
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
  // WhatsApp has a ~1600 char limit per message
  const truncated = message.length > 1500
    ? message.substring(0, 1480) + '\n\n_(messaggio troppo lungo, troncato)_'
    : message
  return new Response(buildTwiMLResponse(truncated), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

// ---------------------------------------------------------------------------
// Twilio helpers
// ---------------------------------------------------------------------------

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  return 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64')
}

async function sendWhatsApp(phoneNumber: string, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const params = new URLSearchParams({
    From: process.env.TWILIO_WHATSAPP_NUMBER!,
    To: `whatsapp:${phoneNumber}`,
    Body: message,
  })
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: twilioAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
}

// ---------------------------------------------------------------------------
// Media handling
// ---------------------------------------------------------------------------

async function transcribeAudio(mediaUrl: string, mimeType: string): Promise<string | null> {
  try {
    const res = await fetch(mediaUrl, { headers: { Authorization: twilioAuth() } })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: mimeType.includes('ogg') ? 'audio/ogg' : mimeType, data: Buffer.from(buf).toString('base64') } },
          { text: `Trascrivi questo messaggio vocale in italiano. Rispondi SOLO con la trascrizione.` },
        ],
      }],
    })
    const text = result.text?.trim()
    return text && text.length >= 2 ? text : null
  } catch (err) {
    console.error('Audio error:', err)
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleReceiptPhoto(supabase: any, householdId: string, mediaUrl: string, mimeType: string, caption: string): Promise<string> {
  console.log('[image] downloading from:', mediaUrl, 'type:', mimeType)
  const res = await fetch(mediaUrl, { headers: { Authorization: twilioAuth() } })
  console.log('[image] download status:', res.status)
  if (!res.ok) return '📷 Non riesco a scaricare l\'immagine. Riprova.'

  const buf = await res.arrayBuffer()
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: Buffer.from(buf).toString('base64') } },
        { text: `Analizza questa immagine. Se è uno scontrino, ricevuta, lista della spesa, o foto di cibo/prodotti, estrai tutti i prodotti alimentari.
${caption ? `L'utente ha scritto: "${caption}"` : ''}

Rispondi SOLO con un JSON array:
[{"name": "nome in italiano", "qty": 1, "unit": "pz|kg|g|litri|ml|scatole", "estimated_expiry_days": N, "category": "Protein|Vegetable|Fruit|Dairy|Carbohydrate|Condiment|General"}]

Se non ci sono prodotti alimentari, rispondi con: []
Solo JSON, no markdown, no backtick.` },
      ],
    }],
  })

  const raw = result.text?.replace(/```json\n?|\n?```/g, '').trim() || '[]'

  try {
    const items = JSON.parse(raw)
    if (!Array.isArray(items) || items.length === 0) {
      return '📷 Non ho trovato prodotti alimentari in questa immagine.\n\n⬇️ *Scegli:*\n1️⃣ Scrivi cosa hai comprato\n2️⃣ Mostra il frigo\n3️⃣ Pianifica i pasti'
    }

    const rows = items.map((item: { name: string; qty: number; unit: string; estimated_expiry_days?: number; category?: string }) => ({
      household_id: householdId,
      name: item.name,
      quantity: item.qty || 1,
      unit: item.unit || 'pz',
      category: item.category || 'General',
      expiry_date: item.estimated_expiry_days
        ? new Date(Date.now() + item.estimated_expiry_days * 86_400_000).toISOString().split('T')[0]
        : null,
    }))

    const { error } = await supabase.from('inventory_items').insert(rows)
    if (error) {
      console.error('Insert error:', error)
      return '📷 Ho riconosciuto i prodotti ma non riesco a salvarli. Riprova.'
    }

    const lines = items.map((i: { name: string; qty: number; unit: string }) =>
      `  ✅ ${i.qty} ${i.unit} ${i.name}`
    )

    return `📷 *Scontrino scansionato!*\n\nHo aggiunto al frigo:\n${lines.join('\n')}\n\n⬇️ *Scegli:*\n1️⃣ Mostra il frigo aggiornato\n2️⃣ Cosa cucino con questi?\n3️⃣ Pianifica i pasti della settimana`
  } catch (e) {
    console.error('Receipt parse error:', e)
    return '📷 Non sono riuscito a leggere l\'immagine. Prova con una foto più nitida!'
  }
}

// ---------------------------------------------------------------------------
// Context loader
// ---------------------------------------------------------------------------

interface FridgeContext {
  userName: string
  inventory: Array<{ name: string; quantity: number; unit: string; category: string; expiry_date: string | null }>
  shoppingList: Array<{ name: string }>
  conversationHistory: Array<{ role: string; content: string }>
  householdMembers: Array<{ full_name: string }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadContext(supabase: any, householdId: string, userId: string): Promise<FridgeContext> {
  const [profileRes, inventoryRes, shoppingRes, historyRes, membersRes] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', userId).single(),
    supabase.from('inventory_items').select('name, quantity, unit, category, expiry_date').eq('household_id', householdId).order('expiry_date', { ascending: true, nullsFirst: false }),
    supabase.from('shopping_list_items').select('name').eq('household_id', householdId).eq('checked', false),
    supabase.from('wa_messages').select('role, content').eq('household_id', householdId).order('created_at', { ascending: false }).limit(10),
    supabase.from('users').select('full_name').eq('household_id', householdId),
  ])

  return {
    userName: profileRes.data?.full_name?.split(' ')[0] || 'amico',
    inventory: inventoryRes.data || [],
    shoppingList: shoppingRes.data || [],
    conversationHistory: (historyRes.data || []).reverse(),
    householdMembers: membersRes.data || [],
  }
}

function buildFridgeSnapshot(ctx: FridgeContext): string {
  const now = Date.now()

  if (ctx.inventory.length === 0) return 'Il frigo è VUOTO.'

  const lines = ctx.inventory.map((i) => {
    let exp = ''
    if (i.expiry_date) {
      const days = Math.ceil((new Date(i.expiry_date).getTime() - now) / 86_400_000)
      exp = days < 0 ? ' [SCADUTO]' : days <= 3 ? ` [scade tra ${days}g!]` : ` [${days}g]`
    }
    return `- ${i.quantity} ${i.unit} ${i.name} (${i.category})${exp}`
  })

  let snapshot = `Frigo (${ctx.inventory.length} prodotti):\n${lines.join('\n')}`

  if (ctx.shoppingList.length > 0) {
    snapshot += `\n\nLista spesa (${ctx.shoppingList.length}): ${ctx.shoppingList.map(i => i.name).join(', ')}`
  }

  snapshot += `\n\nMembri famiglia: ${ctx.householdMembers.map(m => m.full_name).join(', ')}`

  return snapshot
}

// ---------------------------------------------------------------------------
// Conversation memory
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveMessage(supabase: any, userId: string, householdId: string, role: string, content: string) {
  try {
    await supabase.from('wa_messages').insert({
      user_id: userId,
      household_id: householdId,
      role,
      content: content.substring(0, 2000), // cap storage
    })
  } catch {
    // Non-critical, don't fail the request
  }
}

// ---------------------------------------------------------------------------
// Notify household members
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function notifyHousehold(supabase: any, householdId: string, excludeUserId: string, message: string) {
  try {
    const { data: members } = await supabase
      .from('users')
      .select('whatsapp_number')
      .eq('household_id', householdId)
      .not('id', 'eq', excludeUserId)
      .not('whatsapp_number', 'is', null)

    if (!members || members.length === 0) return

    for (const member of members) {
      await sendWhatsApp(member.whatsapp_number, message)
    }
  } catch {
    // Non-critical
  }
}

// ---------------------------------------------------------------------------
// AI Brain
// ---------------------------------------------------------------------------

async function processMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  householdId: string,
  userId: string,
  ctx: FridgeContext,
  userMessage: string,
): Promise<string> {
  const fridgeSnapshot = buildFridgeSnapshot(ctx)

  // Build conversation history for context
  const historyMessages = ctx.conversationHistory.map((m) => ({
    role: m.role as 'user' | 'model',
    parts: [{ text: m.content }],
  }))

  const systemPrompt = `Sei *Kitchen Steward*, un assistente domestico italiano per WhatsApp — simpatico, pratico e anti-spreco.

CONTESTO FRIGO DELLA FAMIGLIA:
${fridgeSnapshot}

REGOLE IMPORTANTI:
1. Rispondi SEMPRE in italiano, in modo naturale e amichevole. Usa il nome dell'utente (${ctx.userName}) ogni tanto.
2. Usa formattazione WhatsApp: *grassetto*, _corsivo_
3. Usa emoji con moderazione ma efficacia
4. Sii conciso (max 800 caratteri escluse le opzioni). WhatsApp non è un blog.
5. HAI MEMORIA: sopra ci sono i messaggi precedenti della conversazione. Usali per capire il contesto. Se l'utente dice "un'altra" o "ancora" o "cambia", riferisciti a ciò che hai detto prima.

MENU OPZIONI (OBBLIGATORIO):
Alla fine di OGNI risposta, aggiungi SEMPRE un menu di opzioni numerate. L'utente può rispondere con il numero. Formato:

⬇️ *Scegli:*
1️⃣ [azione breve]
2️⃣ [azione breve]
3️⃣ [azione breve]

Le opzioni devono essere CONTESTUALI e includere spesso "Pianifica i pasti della settimana" come opzione. Esempi:
- Dopo frigo: 1 Ricetta 2 Scadenze 3 Pianifica i pasti della settimana
- Dopo ricetta: 1 Un'altra ricetta 2 Segna ingredienti usati 3 Pianifica i pasti della settimana
- Dopo aggiunta prodotti: 1 Mostra frigo 2 Cosa cucino? 3 Genera la spesa
- Dopo spesa: 1 Pianifica i pasti della settimana 2 Ricetta con quello che ho 3 Mostra frigo
- Dopo meal plan: 1 Genera spesa per il piano 2 Mostra il frigo 3 Cambia un giorno

Quando l'utente risponde SOLO con un numero (1, 2, 3), esegui l'opzione corrispondente dall'ultimo menu proposto nella conversazione.

FORMATO LISTA DELLA SPESA:
Quando generi una lista della spesa, usa questo formato pulito per copia-incolla su Google Keep / Apple Notes:

🛒 *Lista della spesa*

☐ Latte
☐ Uova
☐ Pane

📋 _Tieni premuto → Copia → Incolla su Google Keep o Note!_

Ogni riga ☐ diventa checkbox in Google Keep. Lista PULITA: solo ☐ + nome.

MEAL PLANNING:
Quando l'utente chiede di pianificare i pasti, genera un piano settimanale (Lun-Dom) con pranzo e cena. Formato:

🗓️ *Piano pasti della settimana*

*Lunedì*
🍽️ Pranzo: [piatto]
🍽️ Cena: [piatto]

*Martedì*
...

Priorità: usa ingredienti nel frigo (soprattutto quelli in scadenza), poi suggerisci cosa comprare. Alla fine del piano, aggiungi la lista della spesa per gli ingredienti mancanti con il blocco SAVE_SHOPPING.

AZIONI DATABASE:
Quando l'utente vuole AGGIUNGERE prodotti al frigo:
<<<ADD_ITEMS>>>
[{"name": "...", "qty": N, "unit": "pz|kg|g|litri|ml|scatole", "estimated_expiry_days": N, "category": "Protein|Vegetable|Fruit|Dairy|Carbohydrate|Condiment|General"}]
<<<END_ITEMS>>>

Quando vuole RIMUOVERE prodotti:
<<<DELETE_ITEMS>>>
["nome1", "nome2"]
<<<END_ITEMS>>>

Quando generi una lista della spesa, salvala anche:
<<<SAVE_SHOPPING>>>
[{"name": "...", "category": "General"}]
<<<END_ITEMS>>>

IMPORTANTE PER RIMOZIONE: prima di rimuovere, chiedi conferma! "Rimuovo X dal frigo?" e metti come opzione 1️⃣ Sì, rimuovi. Solo quando l'utente conferma, includi il blocco DELETE_ITEMS.

NOTIFICA FAMIGLIA:
Quando l'utente aggiunge o rimuove prodotti, includi un blocco notifica:
<<<NOTIFY_FAMILY>>>
[messaggio breve per gli altri membri, es: "🛒 David ha aggiunto pollo e uova al frigo"]
<<<END_NOTIFY>>>

I blocchi <<<>>> vengono rimossi dal messaggio visibile. Il testo prima/dopo è ciò che l'utente vede.
Se l'utente invia una foto, la descrizione è fornita come contesto.`

  const contents = [
    { role: 'user' as const, parts: [{ text: systemPrompt }] },
    { role: 'model' as const, parts: [{ text: 'Capito! Sono Kitchen Steward.' }] },
    ...historyMessages.map(m => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: m.parts,
    })),
    {
      role: 'user' as const,
      parts: [{ text: userMessage }],
    },
  ]

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
  })

  let reply = result.text?.trim() || 'Scusa, non ho capito. Puoi ripetere?'

  // Process ADD_ITEMS
  const addMatch = reply.match(/<<<ADD_ITEMS>>>\n?([\s\S]*?)\n?<<<END_ITEMS>>>/)
  if (addMatch) {
    try {
      const items = JSON.parse(addMatch[1])
      if (Array.isArray(items) && items.length > 0) {
        const rows = items.map((item: { name: string; qty: number; unit: string; estimated_expiry_days?: number; category?: string }) => ({
          household_id: householdId,
          name: item.name,
          quantity: item.qty || 1,
          unit: item.unit || 'pz',
          category: item.category || 'General',
          expiry_date: item.estimated_expiry_days
            ? new Date(Date.now() + item.estimated_expiry_days * 86_400_000).toISOString().split('T')[0]
            : null,
        }))
        await supabase.from('inventory_items').insert(rows)
      }
    } catch (e) {
      console.error('ADD_ITEMS error:', e)
    }
    reply = reply.replace(/<<<ADD_ITEMS>>>[\s\S]*?<<<END_ITEMS>>>/g, '').trim()
  }

  // Process DELETE_ITEMS
  const delMatch = reply.match(/<<<DELETE_ITEMS>>>\n?([\s\S]*?)\n?<<<END_ITEMS>>>/)
  if (delMatch) {
    try {
      const names: string[] = JSON.parse(delMatch[1])
      for (const name of names) {
        const { data: found } = await supabase
          .from('inventory_items')
          .select('id')
          .eq('household_id', householdId)
          .ilike('name', `%${name}%`)
        if (found && found.length > 0) {
          await supabase.from('inventory_items').delete().in('id', found.map((f: { id: string }) => f.id))
        }
      }
    } catch (e) {
      console.error('DELETE_ITEMS error:', e)
    }
    reply = reply.replace(/<<<DELETE_ITEMS>>>[\s\S]*?<<<END_ITEMS>>>/g, '').trim()
  }

  // Process SAVE_SHOPPING
  const shopMatch = reply.match(/<<<SAVE_SHOPPING>>>\n?([\s\S]*?)\n?<<<END_ITEMS>>>/)
  if (shopMatch) {
    try {
      const items: Array<{ name: string; category: string }> = JSON.parse(shopMatch[1])
      if (items.length > 0) {
        const { data: existing } = await supabase
          .from('shopping_list_items')
          .select('name')
          .eq('household_id', householdId)
          .eq('checked', false)
        const existingNames = new Set((existing || []).map((i: { name: string }) => i.name.toLowerCase()))
        const newItems = items
          .filter(i => !existingNames.has(i.name.toLowerCase()))
          .map(i => ({ household_id: householdId, name: i.name, category: i.category || 'General', checked: false }))
        if (newItems.length > 0) {
          await supabase.from('shopping_list_items').insert(newItems)
        }
      }
    } catch (e) {
      console.error('SAVE_SHOPPING error:', e)
    }
    reply = reply.replace(/<<<SAVE_SHOPPING>>>[\s\S]*?<<<END_ITEMS>>>/g, '').trim()
  }

  // Process NOTIFY_FAMILY
  const notifyMatch = reply.match(/<<<NOTIFY_FAMILY>>>\n?([\s\S]*?)\n?<<<END_NOTIFY>>>/)
  if (notifyMatch) {
    const notifyMsg = notifyMatch[1].trim()
    if (notifyMsg) {
      // Fire and forget — don't block the response
      notifyHousehold(supabase, householdId, userId, notifyMsg).catch(() => {})
    }
    reply = reply.replace(/<<<NOTIFY_FAMILY>>>[\s\S]*?<<<END_NOTIFY>>>/g, '').trim()
  }

  // Clean up empty lines
  reply = reply.replace(/\n{3,}/g, '\n\n')

  // Save conversation to memory
  await saveMessage(supabase, userId, householdId, 'user', userMessage)
  await saveMessage(supabase, userId, householdId, 'assistant', reply)

  return reply
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
    let body = (formData.get('Body') as string | null)?.trim() ?? ''
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

    // Handle media
    if (numMedia > 0) {
      const mediaType = (formData.get('MediaContentType0') as string) || ''
      const mediaUrl = formData.get('MediaUrl0') as string | null

      if (mediaType.startsWith('audio/') && mediaUrl) {
        const transcribed = await transcribeAudio(mediaUrl, mediaType)
        if (transcribed) {
          body = transcribed
        } else {
          return twiml('🎤 Non ho capito il vocale. Puoi riprovare o scriverlo?')
        }
      } else if (mediaType.startsWith('image/') && mediaUrl) {
        try {
          const result = await handleReceiptPhoto(supabase, user.household_id, mediaUrl, mediaType, body)
          return twiml(result)
        } catch (imgErr) {
          console.error('Image error:', imgErr)
          return twiml('📷 Non sono riuscito a elaborare la foto. Prova a scrivere i prodotti a mano!')
        }
      }
    }

    if (!body) {
      return twiml('Non ho ricevuto nessun messaggio. Scrivimi qualcosa!')
    }

    // Load context and process text message
    const ctx = await loadContext(supabase, user.household_id, user.id)
    const reply = await processMessage(supabase, user.household_id, user.id, ctx, body)

    return twiml(reply)
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return twiml('Si è verificato un errore. Riprova tra qualche istante.')
  }
}
