import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'
import {
  parseWhatsAppNumber,
  buildTwiMLResponse,
  formatAddedItems,
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
  return new Response(buildTwiMLResponse(message), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

// ---------------------------------------------------------------------------
// Media handling
// ---------------------------------------------------------------------------

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  return 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64')
}

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
          { text: `Trascrivi questo messaggio vocale in italiano. Rispondi SOLO con la trascrizione, nient'altro.` },
        ],
      }],
    })
    const text = result.text?.trim()
    if (!text || text.length < 2) return null
    console.log('[voice]', text)
    return text
  } catch (err) {
    console.error('Audio error:', err)
    return null
  }
}

async function extractFromImage(mediaUrl: string, mimeType: string, caption: string): Promise<string | null> {
  try {
    const res = await fetch(mediaUrl, { headers: { Authorization: twilioAuth() } })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: Buffer.from(buf).toString('base64') } },
          { text: `Descrivi cosa vedi in questa immagine nel contesto di cibo/cucina/spesa. ${caption ? `L'utente ha scritto: "${caption}"` : ''}. Rispondi in italiano, breve.` },
        ],
      }],
    })
    return result.text?.trim() || null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Fridge context loader
// ---------------------------------------------------------------------------

interface FridgeContext {
  userName: string
  inventory: Array<{ name: string; quantity: number; unit: string; category: string; expiry_date: string | null }>
  shoppingList: Array<{ name: string; checked: boolean }>
  expiringSoon: number
  expired: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadFridgeContext(supabase: any, householdId: string, userId: string): Promise<FridgeContext> {
  const [profileRes, inventoryRes, shoppingRes] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', userId).single(),
    supabase.from('inventory_items').select('name, quantity, unit, category, expiry_date').eq('household_id', householdId).order('expiry_date', { ascending: true, nullsFirst: false }),
    supabase.from('shopping_list_items').select('name, checked').eq('household_id', householdId).eq('checked', false),
  ])

  const inventory = inventoryRes.data || []
  const now = Date.now()

  let expiringSoon = 0
  let expired = 0
  for (const item of inventory) {
    if (!item.expiry_date) continue
    const days = Math.ceil((new Date(item.expiry_date).getTime() - now) / 86_400_000)
    if (days < 0) expired++
    else if (days <= 3) expiringSoon++
  }

  return {
    userName: profileRes.data?.full_name?.split(' ')[0] || 'amico',
    inventory,
    shoppingList: shoppingRes.data || [],
    expiringSoon,
    expired,
  }
}

function buildFridgeSnapshot(ctx: FridgeContext): string {
  if (ctx.inventory.length === 0) return 'Il frigo è VUOTO.'

  const now = Date.now()
  const lines = ctx.inventory.map((i) => {
    let exp = ''
    if (i.expiry_date) {
      const days = Math.ceil((new Date(i.expiry_date).getTime() - now) / 86_400_000)
      exp = days < 0 ? ' [SCADUTO]' : days <= 3 ? ` [scade tra ${days}g]` : ` [${days}g]`
    }
    return `- ${i.quantity} ${i.unit} ${i.name} (${i.category})${exp}`
  })

  let snapshot = `Frigo (${ctx.inventory.length} prodotti):\n${lines.join('\n')}`
  if (ctx.shoppingList.length > 0) {
    snapshot += `\n\nLista spesa attuale (${ctx.shoppingList.length}): ${ctx.shoppingList.map(i => i.name).join(', ')}`
  }
  return snapshot
}

// ---------------------------------------------------------------------------
// AI Brain — single conversational AI with tools
// ---------------------------------------------------------------------------

async function processMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  householdId: string,
  ctx: FridgeContext,
  userMessage: string,
  imageDescription?: string,
): Promise<string> {
  const fridgeSnapshot = buildFridgeSnapshot(ctx)

  const systemPrompt = `Sei *Kitchen Steward*, un assistente domestico italiano per WhatsApp — simpatico, pratico e anti-spreco.

CONTESTO FRIGO DELLA FAMIGLIA:
${fridgeSnapshot}

REGOLE:
1. Rispondi SEMPRE in italiano, in modo naturale e amichevole
2. Usa formattazione WhatsApp: *grassetto*, _corsivo_, ~barrato~
3. Usa emoji con moderazione ma efficacia
4. Sii conciso ma completo (WhatsApp, non un blog)
5. IMPORTANTE: Alla fine di OGNI risposta, aggiungi SEMPRE una sezione "suggerimenti successivi" con 2-3 opzioni numerate che l'utente può scegliere. Queste devono essere contestuali a ciò che hai appena risposto. Formato:

---
_Cosa facciamo ora?_
1️⃣ [opzione contestuale]
2️⃣ [opzione contestuale]
3️⃣ [opzione contestuale]

CAPACITÀ:
- Mostrare il contenuto del frigo
- Suggerire ricette basate su ingredienti (priorità a quelli in scadenza)
- Generare lista della spesa intelligente (formattata con ☐ per Google Keep)
- Dare consigli anti-spreco e curiosità sul cibo
- Capire quando l'utente vuole aggiungere o togliere prodotti
- Rispondere a domande generiche su cucina, conservazione, nutrizione

AZIONI SPECIALI — quando l'utente vuole AGGIUNGERE o RIMUOVERE prodotti, rispondi con un JSON block che il sistema interpreterà.

Per AGGIUNGERE prodotti, includi nel tuo messaggio:
<<<ADD_ITEMS>>>
[{"name": "...", "qty": N, "unit": "pz|kg|g|litri|ml|scatole", "estimated_expiry_days": N, "category": "Protein|Vegetable|Fruit|Dairy|Carbohydrate|Condiment|General"}]
<<<END_ITEMS>>>

Per RIMUOVERE prodotti, includi:
<<<DELETE_ITEMS>>>
["nome prodotto 1", "nome prodotto 2"]
<<<END_ITEMS>>>

Il testo visibile prima/dopo i blocchi verrà mostrato all'utente (i blocchi stessi verranno nascosti).
Se l'utente invia una foto, la descrizione è fornita come contesto.`

  const userContent = imageDescription
    ? `[L'utente ha inviato una foto: ${imageDescription}]\n\nMessaggio: ${userMessage || '(nessun testo)'}`
    : userMessage

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Capito! Sono Kitchen Steward, pronto ad aiutare.' }] },
      { role: 'user', parts: [{ text: userContent }] },
    ],
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
        const { error } = await supabase.from('inventory_items').insert(rows)
        if (error) console.error('Insert error:', error)
      }
    } catch (e) {
      console.error('ADD_ITEMS parse error:', e)
    }
    // Remove the block from visible reply
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
      console.error('DELETE_ITEMS parse error:', e)
    }
    reply = reply.replace(/<<<DELETE_ITEMS>>>[\s\S]*?<<<END_ITEMS>>>/g, '').trim()
  }

  // Process SHOPPING_LIST save
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
      console.error('SAVE_SHOPPING parse error:', e)
    }
    reply = reply.replace(/<<<SAVE_SHOPPING>>>[\s\S]*?<<<END_ITEMS>>>/g, '').trim()
  }

  // Clean up any remaining empty lines from block removal
  reply = reply.replace(/\n{3,}/g, '\n\n')

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

    console.log('[webhook]', { from, body: body.substring(0, 50), numMedia })

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
      return twiml('Il tuo account non è collegato a nessun nucleo familiare. Completa la configurazione su Kitchen Steward.')
    }

    // Handle media
    let imageDescription: string | undefined
    if (numMedia > 0) {
      const mediaType = (formData.get('MediaContentType0') as string) || ''
      const mediaUrl = formData.get('MediaUrl0') as string | null

      if (mediaType.startsWith('audio/') && mediaUrl) {
        const transcribed = await transcribeAudio(mediaUrl, mediaType)
        if (transcribed) {
          body = transcribed
        } else {
          return twiml('🎤 Non sono riuscito a capire il vocale. Puoi riprovare o scriverlo?')
        }
      } else if (mediaType.startsWith('image/') && mediaUrl) {
        imageDescription = await extractFromImage(mediaUrl, mediaType, body) ?? undefined
        if (!imageDescription && !body) {
          return twiml('📷 Non sono riuscito a capire l\'immagine. Prova ad aggiungere una descrizione!')
        }
      }
    }

    if (!body && !imageDescription) {
      return twiml('Non ho ricevuto nessun messaggio. Scrivimi qualcosa!')
    }

    // Load full fridge context
    const ctx = await loadFridgeContext(supabase, user.household_id, user.id)

    // Let the AI brain handle everything
    const reply = await processMessage(supabase, user.household_id, ctx, body, imageDescription)

    return twiml(reply)
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return twiml('Si è verificato un errore. Riprova tra qualche istante.')
  }
}
