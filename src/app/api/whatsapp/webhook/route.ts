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
// Clients (initialised once per cold-start)
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

const HELP_TEXT = `🍳 *Kitchen Steward — Comandi WhatsApp*

Scrivi qualsiasi lista di prodotti e la aggiungo al frigo.

Comandi speciali:
• *lista* o *frigo* — mostra il contenuto del frigo
• *scadenze* — prodotti in scadenza nei prossimi 3 giorni
• *ricetta* — suggerisci una ricetta con quello che hai
• *ricetta veloce* — ricetta in max 15 minuti
• *ricetta per 4* — ricetta per 4 persone
• *spesa* — mostra la lista della spesa
• *curiosità* — fatto curioso sul cibo anti-spreco
• *elimina [prodotto]* — rimuovi un prodotto dal frigo
• *aiuto* o *help* — mostra questo messaggio`

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
    const body = (formData.get('Body') as string | null)?.trim() ?? ''
    const from = (formData.get('From') as string | null) ?? ''

    const phoneNumber = parseWhatsAppNumber(from)

    // --- Authenticate user by phone number ---
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

    // --- Route command ---
    const command = body.toLowerCase()

    if (command === 'aiuto' || command === 'help') {
      return twiml(HELP_TEXT)
    }

    if (command === 'lista' || command === 'frigo') {
      return await handleInventoryList(supabase, householdId)
    }

    if (command === 'scadenze') {
      return await handleExpiring(supabase, householdId)
    }

    if (command.startsWith('ricetta')) {
      return await handleRecipeSuggestion(supabase, householdId, command)
    }

    if (command === 'spesa') {
      return await handleShoppingList(supabase, householdId)
    }

    if (command === 'curiosità' || command === 'curiosita') {
      return await handleFoodFact()
    }

    if (command.startsWith('elimina ')) {
      return await handleDeleteItem(supabase, householdId, body.slice(8).trim())
    }

    // Default: treat as grocery text to parse & add
    return await handleAddItems(supabase, householdId, body)
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return twiml(
      'Si è verificato un errore. Riprova tra qualche istante.'
    )
  }
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

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
async function handleRecipeSuggestion(supabase: any, householdId: string, command: string) {
  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('name, quantity, unit, category, expiry_date')
    .eq('household_id', householdId)
    .order('expiry_date', { ascending: true, nullsFirst: false })

  if (error || !items || items.length === 0) {
    return twiml(
      'Il frigo è vuoto, non posso suggerire una ricetta! Aggiungi prima qualcosa.'
    )
  }

  // Parse optional modifiers from command
  const timeMatch = command.match(/(\d+)\s*min/)
  const servingsMatch = command.match(/per\s*(\d+)/)
  const isQuick = command.includes('veloce') || command.includes('rapida')

  const maxTime = timeMatch ? parseInt(timeMatch[1]) : isQuick ? 15 : null
  const servings = servingsMatch ? parseInt(servingsMatch[1]) : 2

  const ingredientsList = items
    .map((i: { name: string; quantity: number; unit: string; expiry_date: string | null }) => {
      const daysLeft = i.expiry_date
        ? Math.ceil(
            (new Date(i.expiry_date).getTime() - Date.now()) / 86_400_000
          )
        : null
      return `- ${i.quantity} ${i.unit} ${i.name}${daysLeft !== null ? ` (scade tra ${daysLeft} giorni)` : ''}`
    })
    .join('\n')

  const timeConstraint = maxTime ? `\nTempo massimo di preparazione: ${maxTime} minuti.` : ''

  const prompt = `Sei uno chef anti-spreco italiano creativo e simpatico. Dati questi ingredienti nel frigo, suggerisci UNA ricetta per ${servings} persone che usi prioritariamente gli ingredienti che scadono prima.

Ingredienti:
${ingredientsList}
${timeConstraint}

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

    const recipeText =
      response.text?.trim() || 'Non sono riuscito a generare una ricetta.'
    return twiml(recipeText)
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
    return twiml('🛒 La lista della spesa è vuota!')
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
    msg += checked
      .map((i: { name: string }) => `  ~${i.name}~`)
      .join('\n')
  }

  return twiml(msg)
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
    return twiml('Scrivi *elimina* seguito dal nome del prodotto. Es: *elimina latte*')
  }

  // Fuzzy match: find items whose name contains the search term
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

  // Delete all matching items
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
  text: string
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

    const raw =
      response.text?.replace(/```json\n?|\n?```/g, '').trim() || '[]'
    const parsed: Array<{
      name: string
      qty: number
      unit: string
      estimated_expiry_days?: number
      category?: string
    }> = JSON.parse(raw)

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return twiml(
        'Non sono riuscito a riconoscere nessun prodotto nel tuo messaggio. Prova a scrivere qualcosa come "2 kg pollo, 6 uova, 1 litro latte".'
      )
    }

    // Build rows for Supabase insert
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

    const { error } = await supabase
      .from('inventory_items')
      .insert(rows)

    if (error) {
      console.error('Insert error:', error)
      return twiml(
        'Non sono riuscito a salvare i prodotti. Riprova tra poco.'
      )
    }

    return twiml(formatAddedItems(parsed))
  } catch (err) {
    console.error('AI parse error:', err)
    return twiml(
      'Non sono riuscito a capire il messaggio. Prova a scrivere qualcosa come "2 kg pollo, 6 uova, 1 litro latte".'
    )
  }
}
