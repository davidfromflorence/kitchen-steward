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
• *ricetta* — suggerisci una ricetta con quello che hai
• *aiuto* o *help* — mostra questo messaggio`

// ---------------------------------------------------------------------------
// GET — webhook verification (Twilio doesn't strictly require it, but safe)
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
      .eq('phone_number', phoneNumber)
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

    if (command === 'ricetta' || command === 'recipe') {
      return await handleRecipeSuggestion(supabase, householdId)
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

async function handleInventoryList(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  householdId: string
) {
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

async function handleRecipeSuggestion(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  householdId: string
) {
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

  const prompt = `Sei uno chef anti-spreco italiano. Dati questi ingredienti nel frigo, suggerisci UNA ricetta veloce che usi prioritariamente gli ingredienti che scadono prima.

Ingredienti:
${ingredientsList}

Rispondi in italiano con:
- Nome della ricetta
- Tempo di preparazione
- Passi veloci (max 5)
- Perché questa ricetta riduce lo spreco

Rispondi in testo semplice (no JSON, no markdown), adatto a WhatsApp.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const recipeText =
      response.text?.trim() || 'Non sono riuscito a generare una ricetta.'
    return twiml(`🍳 *Ricetta suggerita*\n\n${recipeText}`)
  } catch (err) {
    console.error('Recipe generation error:', err)
    return twiml('Non riesco a generare una ricetta in questo momento. Riprova!')
  }
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
