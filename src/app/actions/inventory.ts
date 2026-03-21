'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { calculateExpiryDate, defaultZone, normalizeZone } from '@/lib/shelf-life'

async function getAuthAndHousehold() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) redirect('/setup')

  return { supabase, householdId: profile.household_id }
}

function revalidateAll() {
  revalidatePath('/dashboard')
  revalidatePath('/fridge')
}

export async function addItem(formData: FormData) {
  const { supabase, householdId } = await getAuthAndHousehold()

  const name = formData.get('name') as string
  const quantity = Number(formData.get('quantity')) || 1
  const unit = (formData.get('unit') as string) || 'pz'
  const category = (formData.get('category') as string) || 'General'
  const manualExpiry = formData.get('expiry_date') as string | null

  const zone = defaultZone(category)
  // Use manual expiry if provided, otherwise calculate from shelf-life
  const expiry_date = manualExpiry || calculateExpiryDate(name, category, zone)

  const { data: inserted, error } = await supabase
    .from('inventory_items')
    .insert([{ household_id: householdId, name, quantity, unit, category, zone, expiry_date }])
    .select()

  if (error) {
    console.error('Error adding item:', error)
    return { error: error.message }
  }

  if (!inserted || inserted.length === 0) {
    return { error: `RLS blocked insert. household_id=${householdId}` }
  }

  revalidateAll()
  return { success: true }
}

export async function addItems(
  items: Array<{
    name: string
    quantity: number
    unit: string
    category: string
    expiry_days?: number
  }>
) {
  const { supabase, householdId } = await getAuthAndHousehold()

  const rows = items.map((item) => {
    const category = item.category || 'General'
    const zone = defaultZone(category)
    // Always use shelf-life map — ignore AI's expiry_days estimate
    const expiry_date = calculateExpiryDate(item.name, category, zone)

    return {
      household_id: householdId,
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || 'pz',
      category,
      zone,
      expiry_date,
    }
  })

  const { data: inserted, error } = await supabase
    .from('inventory_items')
    .insert(rows)
    .select()

  if (error) {
    console.error('Error adding items:', error)
    return { error: error.message }
  }

  if (!inserted || inserted.length === 0) {
    return { error: `RLS blocked insert. household_id=${householdId}, items=${rows.length}` }
  }

  revalidateAll()
  return { success: true }
}

export async function deleteItem(formData: FormData) {
  const { supabase } = await getAuthAndHousehold()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting item:', error)
    return { error: error.message }
  }

  revalidateAll()
  return { success: true }
}

export async function useItem(formData: FormData) {
  const { supabase } = await getAuthAndHousehold()
  const id = formData.get('id') as string

  const { data: item } = await supabase
    .from('inventory_items')
    .select('quantity')
    .eq('id', id)
    .single()

  if (!item) return { error: 'Item not found' }

  if (item.quantity <= 1) {
    await supabase.from('inventory_items').delete().eq('id', id)
  } else {
    await supabase
      .from('inventory_items')
      .update({ quantity: item.quantity - 1 })
      .eq('id', id)
  }

  revalidateAll()
  return { success: true }
}

export async function updateQuantity(id: string, newQuantity: number) {
  const { supabase } = await getAuthAndHousehold()

  if (newQuantity <= 0) {
    await supabase.from('inventory_items').delete().eq('id', id)
  } else {
    await supabase
      .from('inventory_items')
      .update({ quantity: Math.round(newQuantity * 100) / 100 })
      .eq('id', id)
  }

  revalidateAll()
  return { success: true }
}

export async function updateExpiry(id: string, expiryDate: string) {
  const { supabase } = await getAuthAndHousehold()

  const { error } = await supabase
    .from('inventory_items')
    .update({ expiry_date: expiryDate })
    .eq('id', id)

  if (error) {
    console.error('Error updating expiry:', error)
    return { error: error.message }
  }

  revalidateAll()
  return { success: true }
}

export async function moveItem(id: string, targetZone: string) {
  const { supabase } = await getAuthAndHousehold()

  const zone = normalizeZone(targetZone)

  // Get item name and category for shelf-life calculation
  const { data: item } = await supabase
    .from('inventory_items')
    .select('name, category')
    .eq('id', id)
    .single()

  const itemName = item?.name || ''
  const category = item?.category || 'General'
  const newExpiry = calculateExpiryDate(itemName, category, zone)

  const { error } = await supabase
    .from('inventory_items')
    .update({ zone, expiry_date: newExpiry })
    .eq('id', id)

  if (error) {
    console.error('Error moving item:', error)
    return { error: error.message }
  }

  revalidateAll()
  return { success: true }
}

export async function logMeal(
  mealDescription: string,
  userProfile?: { portionSize: string; weight: number | null; activityLevel: string; dietNotes: string } | null,
): Promise<{
  success?: boolean
  error?: string
  used: Array<{ name: string; subtracted: number; unit: string; removed: boolean }>
}> {
  const { supabase, householdId } = await getAuthAndHousehold()

  // Get household member count for portion estimation
  const { count: memberCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId)

  const { data: inventory } = await supabase
    .from('inventory_items')
    .select('id, name, quantity, unit')
    .eq('household_id', householdId)
    .order('expiry_date', { ascending: true })

  if (!inventory || inventory.length === 0) {
    return { error: 'Il frigo è vuoto', used: [] }
  }

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

  // Number each item so AI can reference by ID
  const numberedList = inventory.map((i, idx) => `[${idx}] ${i.name} (${i.quantity} ${i.unit})`).join('\n')
  const people = memberCount || 1

  // Build portion multiplier map from user profile
  const portionMultipliers: Record<string, number> = {
    piccola: 0.65,
    normale: 1.0,
    grande: 1.35,
    abbondante: 1.7,
  }
  const userMultiplier = userProfile ? (portionMultipliers[userProfile.portionSize] ?? 1.0) : 1.0

  // Build user profile section for the prompt
  let profileSection = ''
  if (userProfile) {
    const parts: string[] = []
    if (userMultiplier !== 1.0) {
      parts.push(`L'utente mangia porzioni ${userProfile.portionSize === 'piccola' || userProfile.portionSize === 'normale' ? 'piccole' : 'grandi'} (moltiplicatore: ${userMultiplier}x rispetto a porzione standard)`)
    }
    if (userProfile.weight) {
      parts.push(`Peso: ${userProfile.weight}kg`)
    }
    if (userProfile.activityLevel && userProfile.activityLevel !== 'moderato') {
      const actLabels: Record<string, string> = { sedentario: 'sedentario (mangia meno)', attivo: 'attivo (mangia di più)', molto_attivo: 'molto attivo (mangia molto di più)' }
      parts.push(`Livello attività: ${actLabels[userProfile.activityLevel] || userProfile.activityLevel}`)
    }
    if (userProfile.dietNotes?.trim()) {
      parts.push(`Note dell'utente: "${userProfile.dietNotes.trim()}"`)
    }
    if (parts.length > 0) {
      profileSection = `\nPROFILO DELL'UTENTE CHE HA MANGIATO:\n${parts.join('\n')}\nUSA QUESTE INFO per calibrare le quantità. Se il moltiplicatore è 0.65x, una porzione di pasta è ~52g, non 80g. Se è 1.7x, una porzione è ~136g.\n`
    }
  }

  const prompt = `L'utente ha mangiato: "${mealDescription}"
Nucleo familiare: ${people} ${people === 1 ? 'persona' : 'persone'}
${profileSection}
Prodotti nel frigo (con indice):
${numberedList}

COMPITO: identifica SOLO i prodotti che sono stati EFFETTIVAMENTE usati per preparare "${mealDescription}".

REGOLE IMPORTANTI:
- Usa SOLO l'indice [N] per identificare i prodotti
- Se il piatto NON specifica "per 1" o "per me", assumi sia stato preparato SOLO per chi sta parlando (1 persona)
- Se specifica "per 2", "per tutti", "per la famiglia", moltiplica per quel numero
- "pasta al pesto" usa PASTA (tipo Farfalle, Spaghetti ecc) e PESTO, NON pasta sfoglia, NON pasta fresca per tramezzini
- "frittata" usa UOVA e verdure, NON tutto ciò che contiene la parola
- Sii PRECISO: se il piatto è "pasta al pesto" non includere mozzarella, pollo, etc.

PORZIONI STANDARD PER 1 PERSONA (da moltiplicare per il moltiplicatore del profilo se presente):
- Pasta: ~80g, Riso: ~80g, Pesto: ~30g, Sugo: ~80g
- Pollo/Carne: ~150g, Pesce: ~180g
- Uova: 2pz, Mozzarella: 1pz (125g)
- Verdure: ~150g, Insalata: ~80g
- Pane: 2 fette (~60g), Latte: ~200ml
- Formaggio grattugiato: ~20g, Olio: ~15ml, Burro: ~15g

UNITA': rispetta l'unità nel frigo. Se il frigo dice "pz", sottrai in pezzi. Se dice "g", sottrai in grammi. Se dice "ml", in ml. NON convertire.

Rispondi SOLO con JSON array:
[{"index": N, "subtract": quantità_da_sottrarre}]

Se nessun prodotto corrisponde, rispondi []. Solo JSON, no markdown.`

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const raw = result.text?.replace(/```json\n?|\n?```/g, '').trim() || '[]'
    const items: Array<{ index: number; subtract: number }> = JSON.parse(raw)

    const used: Array<{ name: string; subtracted: number; unit: string; removed: boolean }> = []

    for (const item of items) {
      // Match by exact index — no fuzzy matching
      const match = inventory[item.index]
      if (!match) continue

      const newQty = match.quantity - item.subtract
      if (newQty <= 0) {
        await supabase.from('inventory_items').delete().eq('id', match.id)
        used.push({ name: match.name, subtracted: match.quantity, unit: match.unit, removed: true })
      } else {
        await supabase.from('inventory_items').update({ quantity: newQty }).eq('id', match.id)
        used.push({ name: match.name, subtracted: item.subtract, unit: match.unit, removed: false })
      }
    }

    revalidateAll()
    return { success: true, used }
  } catch (e) {
    console.error('logMeal error:', e)
    return { error: 'Non sono riuscito a elaborare il pasto', used: [] }
  }
}
