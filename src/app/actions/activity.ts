'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export type ActivityAction =
  | 'item_added'
  | 'item_used'
  | 'item_used_before_expiry'
  | 'item_wasted'
  | 'item_deleted'
  | 'meal_logged'

interface LogActivityParams {
  action: ActivityAction
  itemName?: string
  itemQuantity?: number
  itemUnit?: string
  xpEarned?: number
  metadata?: Record<string, unknown>
}

async function getAuthAndHousehold() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) redirect('/setup')

  return { supabase, userId: user.id, householdId: profile.household_id }
}

export async function logActivity(params: LogActivityParams) {
  const { supabase, userId, householdId } = await getAuthAndHousehold()

  await supabase.from('activity_log').insert({
    household_id: householdId,
    user_id: userId,
    action: params.action,
    item_name: params.itemName || null,
    item_quantity: params.itemQuantity || null,
    item_unit: params.itemUnit || null,
    xp_earned: params.xpEarned || 0,
    metadata: params.metadata || {},
  })
}

export async function getHouseholdActivity(limit = 20): Promise<Array<{
  id: string
  action: string
  item_name: string | null
  item_quantity: number | null
  item_unit: string | null
  xp_earned: number
  created_at: string
  user_name: string
}>> {
  const { supabase, householdId } = await getAuthAndHousehold()

  const { data } = await supabase
    .from('activity_log')
    .select(`
      id, action, item_name, item_quantity, item_unit, xp_earned, created_at,
      users!activity_log_user_id_fkey ( full_name )
    `)
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data) return []

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    action: row.action as string,
    item_name: row.item_name as string | null,
    item_quantity: row.item_quantity as number | null,
    item_unit: row.item_unit as string | null,
    xp_earned: row.xp_earned as number,
    created_at: row.created_at as string,
    user_name: ((row.users as Record<string, string> | null)?.full_name?.split(' ')[0]) || 'Utente',
  }))
}

export async function getUserStats(): Promise<{
  itemsAdded: number
  itemsUsed: number
  itemsWasted: number
  mealsLogged: number
  totalXpFromActivity: number
  savedBeforeExpiry: number
}> {
  const { supabase, userId } = await getAuthAndHousehold()

  const { data } = await supabase
    .from('activity_log')
    .select('action, xp_earned')
    .eq('user_id', userId)

  if (!data) return { itemsAdded: 0, itemsUsed: 0, itemsWasted: 0, mealsLogged: 0, totalXpFromActivity: 0, savedBeforeExpiry: 0 }

  return {
    itemsAdded: data.filter((r) => r.action === 'item_added').length,
    itemsUsed: data.filter((r) => r.action === 'item_used' || r.action === 'item_used_before_expiry').length,
    itemsWasted: data.filter((r) => r.action === 'item_wasted').length,
    mealsLogged: data.filter((r) => r.action === 'meal_logged').length,
    totalXpFromActivity: data.reduce((sum, r) => sum + (r.xp_earned || 0), 0),
    savedBeforeExpiry: data.filter((r) => r.action === 'item_used_before_expiry').length,
  }
}
