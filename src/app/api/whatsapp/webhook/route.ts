import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'
import {
  parseWhatsAppNumber,
  buildTwiMLResponse,
  formatInventoryList,
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function twiml(message: string) {
  return new Response(buildTwiMLResponse(message), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

// ---------------------------------------------------------------------------
// Audio / Image handling
// ---------------------------------------------------------------------------

async function transcribeAudio(mediaUrl: string, mimeType: string): Promise<string | null> {
  try {
    // Download audio from Twilio (requires auth)
    const accountSid = process.env.TWILIO_ACCOUNT_SID!
    const authToken = process.env.TWILIO_AUTH_TOKEN!

    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
    })

    if (!response.ok) {
      console.error('Failed to download audio:', response.status)
      return null
    }

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    // Send to Gemini for transcription
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType.includes('ogg') ? 'audio/ogg' : mimeType,
              data: base64Audio,
            },
          },
          {
            text: `Trascrivi questo messaggio vocale in italiano. Rispondi SOLO con la trascrizione esatta, nient'altro. Se non riesci a capire, rispondi con una stringa vuota.`,
          },
        ],
      }],
    })

    const text = result.text?.trim()
    if (!text || text.length < 2) return null

    console.log('[voice transcription]', text)
    return text
  } catch (err) {
    console.error('Audio transcription error:', err)
    return null
  }
}

async function handleImageMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  householdId: string,
  mediaUrl: string,
  mimeType: string,
  caption: string,
) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!
    const authToken = process.env.TWILIO_AUTH_TOKEN!

    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
    })

    if (!response.ok) {
      return twiml('Non riesco a scaricare l\'immagine. Riprova.')
    }

    const imageBuffer = await response.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: `Analizza questa foto. Se è uno scontrino o una lista della spesa, estrai i prodotti alimentari.
${caption ? `Nota dell'utente: "${caption}"` : ''}

Rispondi SOLO con un JSON array di oggetti:
[{"name": "nome prodotto in italiano", "qty": numero, "unit": "pz|kg|g|litri|ml|scatole", "estimated_expiry_days": numero, "category": "Protein|Vegetable|Fruit|Dairy|Carbohydrate|Condiment|General"}]

Se non è uno scontrino o non ci sono prodotti alimentari, rispondi con: []
Solo JSON valido, no markdown.`,
          },
        ],
      }],
    })

    const raw = result.text?.replace(/```json\n?|\n?```/g, '').trim() || '[]'
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return twiml('📷 Non ho trovato prodotti alimentari in questa immagine. Prova con una foto di uno scontrino!')
    }

    // Insert into inventory
    const rows = parsed.map((item: { name: string; qty: number; unit: string; estimated_expiry_days?: number; category?: string }) => ({
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
      return twiml('Non sono riuscito a salvare i prodotti. Riprova.')
    }

    return twiml(`📷 Ho riconosciuto dallo scontrino:\n${formatAddedItems(parsed)}`)
  } catch (err) {
    console.error('Image processing error:', err)
    return twiml('Non sono riuscito ad analizzare l\'immagine. Riprova!')
  }
}

// ---------------------------------------------------------------------------
// AI Intent Detection
// ---------------------------------------------------------------------------

type Intent =
  | { action: 'greeting' }
  | { action: 'show_fridge' }
  | { action: 'show_expiring' }
  | { action: 'suggest_recipe'; modifiers: string }
  | { action: 'show_shopping_list' }
  | { action: 'generate_shopping_list' }
  | { action: 'food_fact' }
  | { action: 'delete_item'; item: string }
  | { action: 'add_items'; text: string }
  | { action: 'help' }

async function detectIntent(message: string): Promise<Intent> {
  // Fast exact matches first (no AI call needed)
  const lower = message.toLowerCase().trim()
  const greetings = ['ciao', 'hey', 'hi', 'hello', 'buongiorno', 'buonasera', 'salve', 'hola', 'ehi', 'yo']
  if (greetings.includes(lower)) return { action: 'greeting' }
  // Numbered quick replies from greeting menu
  if (lower === '1') return { action: 'show_fridge' }
  if (lower === '2') return { action: 'suggest_recipe', modifiers: 'ricetta' }
  if (lower === '3') return { action: 'generate_shopping_list' }
  if (lower === '4') return { action: 'show_expiring' }
  if (lower === '5') return { action: 'food_fact' }
  if (lower === 'aiuto' || lower === 'help') return { action: 'help' }
  if (lower === 'lista' || lower === 'frigo') return { action: 'show_fridge' }
  if (lower === 'scadenze') return { action: 'show_expiring' }
  if (lower === 'spesa') return { action: 'show_shopping_list' }
  if (lower === 'curiosità' || lower === 'curiosita') return { action: 'food_fact' }
  if (lower.startsWith('ricetta')) return { action: 'suggest_recipe', modifiers: lower }
  if (lower.startsWith('elimina ')) return { action: 'delete_item', item: message.slice(8).trim() }

  // For anything else, ask AI to classify
  const prompt = `You are an intent classifier for a kitchen/fridge WhatsApp bot. Classify the user's message into ONE intent.

Possible intents:
- greeting: user is saying hello or starting a conversation (e.g. "ciao!", "hey", "buongiorno", "come va?", "eccomi")
- show_fridge: user wants to see what's in the fridge (e.g. "cosa c'è nel frigo?", "che abbiamo?", "fammi vedere il frigo", "what's in the fridge")
- show_expiring: user asks about expiring items (e.g. "cosa scade?", "scadenze", "cosa sta per scadere?")
- suggest_recipe: user wants a recipe suggestion (e.g. "cosa cucino stasera?", "suggeriscimi una ricetta", "what should I cook?", "ho fame")
- show_shopping_list: user wants to see the current shopping list (e.g. "cosa devo comprare?", "lista spesa", "mostra la spesa")
- generate_shopping_list: user wants AI to suggest what to buy based on fridge (e.g. "cosa mi manca?", "generami la spesa", "cosa dovrei comprare?", "what should I buy?", "prepara la lista della spesa")
- food_fact: user wants a food fact or curiosity (e.g. "dimmi una curiosità", "fun fact", "lo sapevi che")
- delete_item: user wants to remove something (e.g. "ho finito il latte", "togli le uova", "abbiamo usato il pollo"). Extract the item name.
- add_items: user is listing groceries they bought/want to add (e.g. "ho comprato 2kg pollo e uova", "aggiungi latte", "pane, burro, mozzarella")
- help: user asks for help (e.g. "cosa puoi fare?", "come funziona?")

User message: "${message}"

Respond with ONLY a JSON object: {"action": "...", "item": "...", "modifiers": "..."}
- "item" only for delete_item
- "modifiers" only for suggest_recipe (include the full user message)
- No other fields needed
Return ONLY JSON, no markdown.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const raw = response.text?.replace(/```json\n?|\n?```/g, '').trim() || '{}'
    const parsed = JSON.parse(raw)

    switch (parsed.action) {
      case 'greeting': return { action: 'greeting' }
      case 'show_fridge': return { action: 'show_fridge' }
      case 'show_expiring': return { action: 'show_expiring' }
      case 'suggest_recipe': return { action: 'suggest_recipe', modifiers: parsed.modifiers || message }
      case 'show_shopping_list': return { action: 'show_shopping_list' }
      case 'generate_shopping_list': return { action: 'generate_shopping_list' }
      case 'food_fact': return { action: 'food_fact' }
      case 'delete_item': return { action: 'delete_item', item: parsed.item || '' }
      case 'help': return { action: 'help' }
      default: return { action: 'add_items', text: message }
    }
  } catch {
    // If AI classification fails, default to add_items
    return { action: 'add_items', text: message }
  }
}

// ---------------------------------------------------------------------------
// GET — webhook verification
// ---------------------------------------------------------------------------

export async function GET() {
  return new NextResponse('OK', { status: 200 })
}

// ---------------------------------------------------------------------------
// POST — incoming WhatsApp message
// ---------------------------------------------------------------------------

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
      return twiml(
        'Non ho trovato il tuo account. Collega il tuo numero WhatsApp nelle impostazioni di Kitchen Steward.'
      )
    }

    const { household_id: householdId } = user

    if (!householdId) {
      return twiml(
        'Il tuo account non è collegato a nessun nucleo familiare. Completa la configurazione su Kitchen Steward.'
      )
    }

    // Handle voice memos and audio
    if (numMedia > 0) {
      const mediaType = (formData.get('MediaContentType0') as string) || ''
      const mediaUrl = formData.get('MediaUrl0') as string | null

      if (mediaType.startsWith('audio/') && mediaUrl) {
        const transcribed = await transcribeAudio(mediaUrl, mediaType)
        if (transcribed) {
          body = transcribed
        } else {
          return twiml('🎤 Non sono riuscito a capire il messaggio vocale. Puoi riprovare o scriverlo?')
        }
      } else if (mediaType.startsWith('image/') && mediaUrl) {
        // Image support (e.g. receipt photo) — treat as add items
        return await handleImageMessage(supabase, householdId, mediaUrl, mediaType, body)
      }
    }

    // Detect intent via AI
    const intent = await detectIntent(body)

    switch (intent.action) {
      case 'greeting':
        return await handleGreeting(supabase, householdId, user.id)
      case 'help':
        return twiml(HELP_TEXT)
      case 'show_fridge':
        return await handleInventoryList(supabase, householdId)
      case 'show_expiring':
        return await handleExpiring(supabase, householdId)
      case 'suggest_recipe':
        return await handleRecipeSuggestion(supabase, householdId, intent.modifiers)
      case 'show_shopping_list':
        return await handleShoppingList(supabase, householdId)
      case 'generate_shopping_list':
        return await handleGenerateShoppingList(supabase, householdId)
      case 'food_fact':
        return await handleFoodFact()
      case 'delete_item':
        return await handleDeleteItem(supabase, householdId, intent.item)
      case 'add_items':
        return await handleAddItems(supabase, householdId, intent.text)
    }
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return twiml('Si è verificato un errore. Riprova tra qualche istante.')
  }
}

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

const HELP_TEXT = `🍳 *Kitchen Steward*

Parla con me in modo naturale! Ecco cosa posso fare:

🧊 *Frigo* — "Cosa c'è nel frigo?" "Che abbiamo?"
⏰ *Scadenze* — "Cosa sta per scadere?"
🍽️ *Ricette* — "Cosa cucino stasera?" "Ricetta veloce per 4"
🛒 *Spesa* — "Cosa devo comprare?" "Genera la lista della spesa"
🗑️ *Elimina* — "Ho finito il latte" "Togli le uova"
💡 *Curiosità* — "Dimmi una curiosità sul cibo"
➕ *Aggiungi* — Scrivi cosa hai comprato: "Pollo, 6 uova, latte"

La spesa generata è formattata per copiarla su Google Keep! 📋`

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleGreeting(supabase: any, householdId: string, userId: string) {
  // Get user name
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] || 'Ciao'

  // Get a quick fridge summary
  const { data: items } = await supabase
    .from('inventory_items')
    .select('name, expiry_date')
    .eq('household_id', householdId)

  const total = items?.length || 0

  const expiringSoon = (items || []).filter((i: { expiry_date: string | null }) => {
    if (!i.expiry_date) return false
    const days = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86_400_000)
    return days >= 0 && days <= 2
  }).length

  let statusLine = ''
  if (total === 0) {
    statusLine = '📦 Il frigo è vuoto — aggiungimi cosa hai comprato!'
  } else {
    statusLine = `🧊 Hai *${total} prodotti* nel frigo`
    if (expiringSoon > 0) {
      statusLine += ` — ⚠️ *${expiringSoon}* in scadenza!`
    }
  }

  return twiml(`👋 Ciao *${firstName}*!

${statusLine}

Cosa vuoi fare?

1️⃣ *Frigo* — Vedi cosa c'è
2️⃣ *Ricetta* — Cosa cucino?
3️⃣ *Spesa* — Genera lista della spesa
4️⃣ *Scadenze* — Cosa scade presto?
5️⃣ *Curiosità* — Fatto curioso sul cibo

Oppure scrivimi cosa hai comprato e lo aggiungo! 🛒`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInventoryList(supabase: any, householdId: string) {
  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('name, quantity, unit, category, expiry_date')
    .eq('household_id', householdId)
    .order('expiry_date', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Inventory fetch error:', error)
    return twiml('Non riesco a recuperare il frigo in questo momento.')
  }

  return twiml(formatInventoryList(items ?? []))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleExpiring(supabase: any, householdId: string) {
  const threeDaysFromNow = new Date(Date.now() + 3 * 86_400_000)
    .toISOString()
    .split('T')[0]

  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('name, quantity, unit, category, expiry_date')
    .eq('household_id', householdId)
    .lte('expiry_date', threeDaysFromNow)
    .order('expiry_date', { ascending: true })

  if (error) {
    return twiml('Non riesco a controllare le scadenze in questo momento.')
  }

  if (!items || items.length === 0) {
    return twiml('✅ Nessun prodotto in scadenza nei prossimi 3 giorni! Ottimo lavoro.')
  }

  const lines = items.map((i: { name: string; quantity: number; unit: string; expiry_date: string }) => {
    const days = Math.ceil(
      (new Date(i.expiry_date).getTime() - Date.now()) / 86_400_000
    )
    const emoji = days <= 0 ? '🔴' : days === 1 ? '🟠' : '🟡'
    const label = days <= 0 ? 'SCADUTO' : days === 1 ? 'scade domani' : `scade tra ${days}g`
    return `${emoji} ${i.quantity} ${i.unit} ${i.name} — ${label}`
  })

  return twiml(`⏰ *Prodotti in scadenza*\n\n${lines.join('\n')}\n\nScrivi *ricetta* per usarli!`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRecipeSuggestion(supabase: any, householdId: string, userMessage: string) {
  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('name, quantity, unit, category, expiry_date')
    .eq('household_id', householdId)
    .order('expiry_date', { ascending: true, nullsFirst: false })

  if (error || !items || items.length === 0) {
    return twiml('Il frigo è vuoto, non posso suggerire una ricetta! Aggiungi prima qualcosa.')
  }

  const command = userMessage.toLowerCase()
  const timeMatch = command.match(/(\d+)\s*min/)
  const servingsMatch = command.match(/per\s*(\d+)/)
  const isQuick = command.includes('veloce') || command.includes('rapida') || command.includes('quick')

  const maxTime = timeMatch ? parseInt(timeMatch[1]) : isQuick ? 15 : null
  const servings = servingsMatch ? parseInt(servingsMatch[1]) : 2

  const ingredientsList = items
    .map((i: { name: string; quantity: number; unit: string; expiry_date: string | null }) => {
      const daysLeft = i.expiry_date
        ? Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86_400_000)
        : null
      return `- ${i.quantity} ${i.unit} ${i.name}${daysLeft !== null ? ` (scade tra ${daysLeft} giorni)` : ''}`
    })
    .join('\n')

  const timeConstraint = maxTime ? `\nTempo massimo di preparazione: ${maxTime} minuti.` : ''
  const userContext = command !== 'ricetta' ? `\nRichiesta specifica dell'utente: "${userMessage}"` : ''

  const prompt = `Sei uno chef anti-spreco italiano creativo e simpatico. Dati questi ingredienti nel frigo, suggerisci UNA ricetta per ${servings} persone che usi prioritariamente gli ingredienti che scadono prima.

Ingredienti:
${ingredientsList}
${timeConstraint}${userContext}

Rispondi in italiano con questo formato:
🍽️ *[Nome ricetta]*
⏱️ [tempo preparazione]
👥 ${servings} persone

*Ingredienti:*
[lista puntata ingredienti con quantità]

*Preparazione:*
[passi numerati, max 6]

♻️ *Anti-spreco:* [una riga su perché questa ricetta riduce lo spreco]

Usa emoji e formattazione WhatsApp (*grassetto*). Testo semplice, no JSON, no markdown con backtick.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })
    return twiml(response.text?.trim() || 'Non sono riuscito a generare una ricetta.')
  } catch (err) {
    console.error('Recipe generation error:', err)
    return twiml('Non riesco a generare una ricetta in questo momento. Riprova!')
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleShoppingList(supabase: any, householdId: string) {
  const { data: items, error } = await supabase
    .from('shopping_list_items')
    .select('name, category, notes, checked')
    .eq('household_id', householdId)
    .order('checked', { ascending: true })
    .order('category', { ascending: true })

  if (error) {
    return twiml('Non riesco a recuperare la lista della spesa.')
  }

  if (!items || items.length === 0) {
    return twiml('🛒 La lista della spesa è vuota!\n\nScrivi "genera la spesa" per creare una lista basata su ciò che manca nel frigo.')
  }

  const unchecked = items.filter((i: { checked: boolean }) => !i.checked)
  const checked = items.filter((i: { checked: boolean }) => i.checked)

  let msg = '🛒 *Lista della spesa*\n\n'

  if (unchecked.length > 0) {
    msg += unchecked
      .map((i: { name: string; notes?: string }) =>
        `• ${i.name}${i.notes ? ` (${i.notes})` : ''}`
      )
      .join('\n')
  }

  if (checked.length > 0) {
    msg += `\n\n✅ *Già presi (${checked.length}):*\n`
    msg += checked.map((i: { name: string }) => `  ~${i.name}~`).join('\n')
  }

  return twiml(msg)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleGenerateShoppingList(supabase: any, householdId: string) {
  // Fetch current inventory
  const { data: inventory } = await supabase
    .from('inventory_items')
    .select('name, quantity, unit, category, expiry_date')
    .eq('household_id', householdId)

  // Fetch existing shopping list
  const { data: existingList } = await supabase
    .from('shopping_list_items')
    .select('name')
    .eq('household_id', householdId)
    .eq('checked', false)

  const inventoryText = (inventory || [])
    .map((i: { name: string; quantity: number; unit: string; category: string; expiry_date: string | null }) => {
      const exp = i.expiry_date
        ? ` (scade: ${i.expiry_date})`
        : ''
      return `- ${i.quantity} ${i.unit} ${i.name} [${i.category}]${exp}`
    })
    .join('\n') || 'Frigo vuoto'

  const existingText = (existingList || [])
    .map((i: { name: string }) => i.name)
    .join(', ') || 'nessuno'

  const prompt = `Sei un assistente domestico italiano esperto. Analizza il contenuto del frigo di una famiglia e suggerisci cosa comprare.

Contenuto attuale del frigo:
${inventoryText}

Già nella lista della spesa: ${existingText}

Genera una lista della spesa intelligente che:
1. Includa gli ESSENZIALI che mancano o stanno finendo (latte, uova, pane, frutta, verdura di base)
2. Suggerisca ingredienti complementari per pasti equilibrati della settimana
3. NON ripeta ciò che è già nel frigo in quantità sufficiente
4. NON ripeta ciò che è già nella lista della spesa
5. Raggruppi per categoria del supermercato

Rispondi con questo formato ESATTO (ogni riga è un elemento da copiare su Google Keep):

🛒 *Lista della spesa suggerita*

*🥛 Latticini:*
☐ Latte
☐ Yogurt

*🥩 Carne/Pesce:*
☐ Petto di pollo

*🥬 Frutta e Verdura:*
☐ Pomodori
☐ Banane

*🍞 Pane e Cereali:*
☐ Pane integrale

*🧂 Dispensa:*
☐ Olio d'oliva

📋 _Copia questo messaggio su Google Keep per usarlo al supermercato!_

Suggerisci 10-15 prodotti max. Solo prodotti comuni italiani. No JSON, no backtick.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const listText = response.text?.trim() || 'Non sono riuscito a generare la lista.'

    // Also save suggested items to the shopping_list_items table
    await saveGeneratedListToDb(supabase, householdId, listText)

    return twiml(listText)
  } catch (err) {
    console.error('Shopping list generation error:', err)
    return twiml('Non riesco a generare la lista della spesa in questo momento.')
  }
}

async function saveGeneratedListToDb(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  householdId: string,
  listText: string,
) {
  // Extract items from the ☐ lines
  const lines = listText.split('\n')
  const items: Array<{ name: string; category: string }> = []

  let currentCategory = 'General'
  const categoryMap: Record<string, string> = {
    'latticini': 'Dairy',
    'carne': 'Protein',
    'pesce': 'Protein',
    'frutta': 'Fruit',
    'verdura': 'Vegetable',
    'pane': 'Carbohydrate',
    'cereali': 'Carbohydrate',
    'dispensa': 'Condiment',
  }

  for (const line of lines) {
    // Detect category headers
    const headerMatch = line.match(/\*.*?([A-Za-zÀ-ú/ ]+).*?\*/)
    if (headerMatch) {
      const headerLower = headerMatch[1].toLowerCase()
      for (const [key, cat] of Object.entries(categoryMap)) {
        if (headerLower.includes(key)) {
          currentCategory = cat
          break
        }
      }
    }

    // Detect items (☐ lines)
    const itemMatch = line.match(/☐\s*(.+)/)
    if (itemMatch) {
      items.push({ name: itemMatch[1].trim(), category: currentCategory })
    }
  }

  if (items.length === 0) return

  // Check which items already exist in the shopping list
  const { data: existing } = await supabase
    .from('shopping_list_items')
    .select('name')
    .eq('household_id', householdId)
    .eq('checked', false)

  const existingNames = new Set(
    (existing || []).map((i: { name: string }) => i.name.toLowerCase())
  )

  const newItems = items
    .filter((i) => !existingNames.has(i.name.toLowerCase()))
    .map((i) => ({
      household_id: householdId,
      name: i.name,
      category: i.category,
      checked: false,
    }))

  if (newItems.length > 0) {
    await supabase.from('shopping_list_items').insert(newItems)
  }
}

async function handleFoodFact() {
  const prompt = `Genera UN fatto curioso e utile sul cibo, la conservazione degli alimenti, o lo spreco alimentare.
Deve essere:
- Sorprendente e interessante
- Pratico (con un consiglio applicabile)
- In italiano
- Breve (max 3 frasi)

Formato:
💡 *Lo sapevi?*
[fatto curioso]

🌱 *Consiglio:* [consiglio pratico collegato]

Usa formattazione WhatsApp. No JSON, no backtick.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })
    return twiml(response.text?.trim() || 'Non riesco a generare una curiosità in questo momento.')
  } catch (err) {
    console.error('Food fact error:', err)
    return twiml('Non riesco a generare una curiosità in questo momento.')
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDeleteItem(supabase: any, householdId: string, itemName: string) {
  if (!itemName) {
    return twiml('Dimmi quale prodotto vuoi togliere. Es: "ho finito il latte"')
  }

  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('id, name, quantity, unit')
    .eq('household_id', householdId)
    .ilike('name', `%${itemName}%`)

  if (error) {
    return twiml('Errore nella ricerca del prodotto.')
  }

  if (!items || items.length === 0) {
    return twiml(`Non ho trovato "${itemName}" nel tuo frigo.`)
  }

  const ids = items.map((i: { id: string }) => i.id)
  const { error: deleteError } = await supabase
    .from('inventory_items')
    .delete()
    .in('id', ids)

  if (deleteError) {
    return twiml('Non sono riuscito a eliminare il prodotto. Riprova.')
  }

  if (items.length === 1) {
    const i = items[0]
    return twiml(`🗑️ Rimosso: ${i.quantity} ${i.unit} ${i.name}`)
  }

  const lines = items.map((i: { name: string; quantity: number; unit: string }) =>
    `  • ${i.quantity} ${i.unit} ${i.name}`
  )
  return twiml(`🗑️ Rimossi ${items.length} prodotti:\n${lines.join('\n')}`)
}

async function handleAddItems(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  householdId: string,
  text: string,
) {
  const prompt = `You are a kitchen inventory assistant. Extract grocery items from the following input.
Return ONLY a JSON array of objects with these fields:
- name: item name in Italian
- qty: number
- unit: one of "pz", "kg", "g", "litri", "ml", "scatole"
- estimated_expiry_days: integer (estimate based on typical shelf life for this product)
- category: one of "Protein", "Vegetable", "Fruit", "Dairy", "Carbohydrate", "Condiment", "General"

Input: ${text}

Return ONLY valid JSON, no markdown.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const raw = response.text?.replace(/```json\n?|\n?```/g, '').trim() || '[]'
    const parsed: Array<{
      name: string
      qty: number
      unit: string
      estimated_expiry_days?: number
      category?: string
    }> = JSON.parse(raw)

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return twiml(
        'Non sono riuscito a riconoscere nessun prodotto. Prova a scrivere qualcosa come "2 kg pollo, 6 uova, 1 litro latte".'
      )
    }

    const rows = parsed.map((item) => {
      const expiry_date = item.estimated_expiry_days
        ? new Date(Date.now() + item.estimated_expiry_days * 86_400_000)
            .toISOString()
            .split('T')[0]
        : null

      return {
        household_id: householdId,
        name: item.name,
        quantity: item.qty || 1,
        unit: item.unit || 'pz',
        category: item.category || 'General',
        expiry_date,
      }
    })

    const { error } = await supabase.from('inventory_items').insert(rows)

    if (error) {
      console.error('Insert error:', error)
      return twiml('Non sono riuscito a salvare i prodotti. Riprova tra poco.')
    }

    return twiml(formatAddedItems(parsed))
  } catch (err) {
    console.error('AI parse error:', err)
    return twiml(
      'Non sono riuscito a capire il messaggio. Prova a scrivere qualcosa come "2 kg pollo, 6 uova, 1 litro latte".'
    )
  }
}
