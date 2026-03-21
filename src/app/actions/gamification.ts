'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

interface GamificationData {
  totalXP: number
  streak: number
  lastLoginDate: string
  completedActions: string[]
  savedItems: string[]
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

export async function loadGamification(): Promise<GamificationData | null> {
  const { supabase, userId } = await getUser()

  const { data } = await supabase
    .from('user_gamification')
    .select('total_xp, streak, last_login_date, completed_actions, saved_items')
    .eq('user_id', userId)
    .single()

  if (!data) return null

  return {
    totalXP: data.total_xp,
    streak: data.streak,
    lastLoginDate: data.last_login_date || '',
    completedActions: data.completed_actions || [],
    savedItems: data.saved_items || [],
  }
}

export async function saveGamification(state: GamificationData): Promise<void> {
  const { supabase, userId } = await getUser()

  await supabase
    .from('user_gamification')
    .upsert({
      user_id: userId,
      total_xp: state.totalXP,
      streak: state.streak,
      last_login_date: state.lastLoginDate || null,
      completed_actions: state.completedActions,
      saved_items: state.savedItems,
      updated_at: new Date().toISOString(),
    })
}

export async function loadFoodProfileFromDB(): Promise<Record<string, unknown> | null> {
  const { supabase, userId } = await getUser()

  const { data } = await supabase
    .from('users')
    .select('food_profile')
    .eq('id', userId)
    .single()

  return data?.food_profile || null
}

export async function saveFoodProfileToDB(profile: Record<string, unknown>): Promise<void> {
  const { supabase, userId } = await getUser()

  await supabase
    .from('users')
    .update({ food_profile: profile })
    .eq('id', userId)
}
