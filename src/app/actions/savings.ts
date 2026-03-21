'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const COST_PER_UNIT: Record<string, number> = {
  Protein: 0.03, Vegetable: 0.004, Fruit: 0.004,
  Dairy: 0.008, Carbohydrate: 0.003, Condiment: 0.02, General: 0.005,
}
const COST_PER_PIECE: Record<string, number> = {
  Protein: 1.50, Vegetable: 0.80, Fruit: 0.50,
  Dairy: 1.20, Carbohydrate: 0.60, Condiment: 2.00, General: 1.00,
}
const CO2_PER_KG = 2.5

function estimateSaving(qty: number, unit: string, category: string) {
  if (unit === 'pz') {
    return { euros: (COST_PER_PIECE[category] || 1.0) * qty, kg: qty * 0.15 }
  }
  if (unit === 'ml' || unit === 'litri') {
    const ml = unit === 'litri' ? qty * 1000 : qty
    return { euros: ml * 0.003, kg: ml / 1000 }
  }
  const g = unit === 'kg' ? qty * 1000 : qty
  return { euros: g * (COST_PER_UNIT[category] || 0.005), kg: g / 1000 }
}

export interface SavingsData {
  totalEuros: number
  totalKg: number
  totalCO2: number
  thisWeekEuros: number
  thisWeekKg: number
  itemsSaved: number
  itemsSavedThisWeek: number
  mealsLogged: number
  streak: number
}

export async function getSavings(): Promise<SavingsData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) redirect('/setup')

  const oneWeekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()

  // Get all "used" activities
  const { data: allUsed } = await supabase
    .from('activity_log')
    .select('action, item_name, item_quantity, item_unit, created_at')
    .eq('household_id', profile.household_id)
    .in('action', ['item_used', 'item_used_before_expiry'])

  // Get inventory for category lookup
  const { data: inventory } = await supabase
    .from('inventory_items')
    .select('name, category')
    .eq('household_id', profile.household_id)

  const catMap = new Map<string, string>()
  for (const item of inventory || []) {
    catMap.set(item.name.toLowerCase(), item.category)
  }

  // Get meals logged count
  const { count: mealsCount } = await supabase
    .from('activity_log')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', profile.household_id)
    .eq('action', 'meal_logged')

  // Get gamification for streak
  const { data: gam } = await supabase
    .from('user_gamification')
    .select('streak')
    .eq('user_id', user.id)
    .single()

  let totalEuros = 0, totalKg = 0, thisWeekEuros = 0, thisWeekKg = 0
  let itemsSaved = 0, itemsSavedThisWeek = 0

  for (const act of allUsed || []) {
    const category = catMap.get((act.item_name || '').toLowerCase()) || 'General'
    const { euros, kg } = estimateSaving(act.item_quantity || 1, act.item_unit || 'pz', category)
    totalEuros += euros
    totalKg += kg
    itemsSaved++

    if (act.created_at >= oneWeekAgo) {
      thisWeekEuros += euros
      thisWeekKg += kg
      itemsSavedThisWeek++
    }
  }

  return {
    totalEuros: Math.round(totalEuros * 100) / 100,
    totalKg: Math.round(totalKg * 100) / 100,
    totalCO2: Math.round(totalKg * CO2_PER_KG * 100) / 100,
    thisWeekEuros: Math.round(thisWeekEuros * 100) / 100,
    thisWeekKg: Math.round(thisWeekKg * 100) / 100,
    itemsSaved,
    itemsSavedThisWeek,
    mealsLogged: mealsCount || 0,
    streak: gam?.streak || 0,
  }
}
