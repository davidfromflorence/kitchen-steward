'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthAndHousehold() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = getAdmin()
  const { data: profile } = await admin
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()
  if (!profile?.household_id) redirect('/setup')
  return { admin, userId: user.id, householdId: profile.household_id }
}

export interface HabitItem {
  name: string
  qty: number
  unit: string
}

export interface Habit {
  id: string
  description: string
  items: HabitItem[]
  frequency: string
  times_per_period: number
  active: boolean
  created_at: string
}

export async function createHabitFromDescription(description: string): Promise<{
  success?: boolean
  error?: string
  habit?: { description: string; items: HabitItem[]; suggestedFrequency: string; suggestedTimes: number }
}> {
  const { admin, householdId } = await getAuthAndHousehold()

  // Get inventory for context
  const { data: inventory } = await admin
    .from('inventory_items')
    .select('name, quantity, unit')
    .eq('household_id', householdId)

  const inventoryList = (inventory || []).map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })

  const prompt = `L'utente vuole creare un'abitudine alimentare: "${description}"

Contenuto frigo: ${inventoryList || 'vuoto'}

Analizza l'abitudine e restituisci un JSON con:
- items: array di prodotti consumati ogni volta, con quantità stimate
- frequency: "daily", "weekly", o "twice_daily"
- times_per_period: quante volte nel periodo (1 per daily = 1 volta al giorno, 2 per daily = 2 volte al giorno)

Esempi:
- "ogni mattina caffè e biscotti" → items: [{"name":"caffè","qty":7,"unit":"g"},{"name":"biscotti","qty":3,"unit":"pz"}], frequency: "daily", times: 1
- "a pranzo e cena mangio pane" → items: [{"name":"pane","qty":50,"unit":"g"}], frequency: "daily", times: 2
- "il weekend mangio yogurt" → items: [{"name":"yogurt","qty":1,"unit":"pz"}], frequency: "weekly", times: 2

Rispondi SOLO JSON: {"items":[{"name":"...","qty":N,"unit":"..."}],"frequency":"daily|weekly|twice_daily","times":N}
No markdown.`

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })

    const raw = result.text?.replace(/```json\n?|\n?```/g, '').trim() || '{}'
    const parsed = JSON.parse(raw)

    return {
      success: true,
      habit: {
        description,
        items: parsed.items || [],
        suggestedFrequency: parsed.frequency || 'daily',
        suggestedTimes: parsed.times || 1,
      },
    }
  } catch (e) {
    console.error('Habit parse error:', e)
    return { error: 'Non sono riuscito a capire l\'abitudine. Riprova.' }
  }
}

export async function saveHabit(
  description: string,
  items: HabitItem[],
  frequency: string,
  timesPerPeriod: number,
) {
  const { admin, userId, householdId } = await getAuthAndHousehold()

  const { error } = await admin.from('habits').insert({
    household_id: householdId,
    user_id: userId,
    description,
    items,
    frequency,
    times_per_period: timesPerPeriod,
    active: true,
  })

  if (error) {
    console.error('Save habit error:', error)
    return { error: 'Errore nel salvataggio.' }
  }

  revalidatePath('/fridge')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getHabits(): Promise<Habit[]> {
  const { admin, householdId } = await getAuthAndHousehold()

  const { data } = await admin
    .from('habits')
    .select('*')
    .eq('household_id', householdId)
    .eq('active', true)
    .order('created_at', { ascending: false })

  return (data || []) as Habit[]
}

export async function deleteHabit(id: string) {
  const { admin } = await getAuthAndHousehold()
  await admin.from('habits').update({ active: false }).eq('id', id)
  revalidatePath('/fridge')
  revalidatePath('/dashboard')
  return { success: true }
}
