import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from './analytics-client'

const COST_PER_PIECE: Record<string, number> = {
  Protein: 1.50, Vegetable: 0.80, Fruit: 0.50,
  Dairy: 1.20, Carbohydrate: 0.60, Condiment: 2.00, General: 1.00,
}
const CO2_PER_KG = 2.5

const CATEGORY_LABELS: Record<string, string> = {
  Vegetable: 'Verdure', Fruit: 'Frutta', Dairy: 'Latticini',
  Protein: 'Proteine', Carbohydrate: 'Carboidrati', Condiment: 'Condimenti',
  General: 'Altro', Frozen: 'Surgelati',
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('household_id, full_name')
    .eq('id', user.id)
    .single()
  if (!profile?.household_id) return redirect('/setup')

  const householdId = profile.household_id

  // Fetch all activity + inventory + members in parallel
  const [activityRes, inventoryRes, membersRes, gamRes] = await Promise.all([
    supabase.from('activity_log')
      .select('action, item_name, item_quantity, item_unit, xp_earned, user_id, created_at, metadata')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false }),
    supabase.from('inventory_items')
      .select('name, quantity, unit, category, expiry_date')
      .eq('household_id', householdId),
    supabase.from('users')
      .select('id, full_name')
      .eq('household_id', householdId),
    supabase.from('user_gamification')
      .select('user_id, total_xp, streak')
      .in('user_id', [user.id]), // will extend to all members below
  ])

  const activities = activityRes.data || []
  const inventory = inventoryRes.data || []
  const members = membersRes.data || []

  // Get gamification for all members
  const memberIds = members.map(m => m.id)
  const { data: allGam } = await supabase
    .from('user_gamification')
    .select('user_id, total_xp, streak')
    .in('user_id', memberIds)
  const gamMap = new Map((allGam || []).map(g => [g.user_id, g]))

  // Current user streak
  const myGam = gamMap.get(user.id)
  const streak = myGam?.streak || 0

  // ── Stats from activity_log ──
  const now = Date.now()
  const oneWeekAgo = now - 7 * 86_400_000
  const oneMonthAgo = now - 30 * 86_400_000

  const usedActions = activities.filter(a => a.action === 'item_used' || a.action === 'item_used_before_expiry')
  const savedBeforeExpiry = activities.filter(a => a.action === 'item_used_before_expiry')
  const mealsLogged = activities.filter(a => a.action === 'meal_logged')
  const itemsAdded = activities.filter(a => a.action === 'item_added')

  // Money saved from used items
  let totalEuros = 0
  let totalKg = 0
  for (const act of usedActions) {
    const qty = act.item_quantity || 1
    const unit = act.item_unit || 'pz'
    const cat = inventory.find(i => i.name === act.item_name)?.category || 'General'
    if (unit === 'pz') {
      totalEuros += (COST_PER_PIECE[cat] || 1.0) * qty
      totalKg += qty * 0.15
    } else if (unit === 'g' || unit === 'kg') {
      const g = unit === 'kg' ? qty * 1000 : qty
      totalEuros += g * 0.005
      totalKg += g / 1000
    } else {
      totalEuros += qty * 0.003
      totalKg += qty / 1000
    }
  }
  const totalCO2 = totalKg * CO2_PER_KG

  // This week
  const thisWeekUsed = usedActions.filter(a => new Date(a.created_at).getTime() > oneWeekAgo)
  const thisWeekMeals = mealsLogged.filter(a => new Date(a.created_at).getTime() > oneWeekAgo)
  const thisWeekSaved = savedBeforeExpiry.filter(a => new Date(a.created_at).getTime() > oneWeekAgo)

  // ── Weekly chart data (last 8 weeks) ──
  const weeklyData: Array<{ label: string; used: number; meals: number; saved: number }> = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = now - (i + 1) * 7 * 86_400_000
    const weekEnd = now - i * 7 * 86_400_000
    const weekActs = activities.filter(a => {
      const t = new Date(a.created_at).getTime()
      return t >= weekStart && t < weekEnd
    })
    const d = new Date(weekEnd)
    const label = `${d.getDate()}/${d.getMonth() + 1}`
    weeklyData.push({
      label,
      used: weekActs.filter(a => a.action === 'item_used' || a.action === 'item_used_before_expiry').length,
      meals: weekActs.filter(a => a.action === 'meal_logged').length,
      saved: weekActs.filter(a => a.action === 'item_used_before_expiry').length,
    })
  }

  // ── Category breakdown from inventory ──
  const categoryCounts: Record<string, number> = {}
  for (const item of inventory) {
    const cat = item.category || 'General'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity
  }
  const sortedCats = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a).slice(0, 5)
  const catTotal = sortedCats.reduce((s, [, c]) => s + c, 0) || 1
  const categoryBreakdown = sortedCats.map(([name, count]) => ({
    name: CATEGORY_LABELS[name] || name,
    percentage: Math.round((count / catTotal) * 100),
  }))

  // ── Leaderboard from real XP ──
  const leaderboard = members.map(m => {
    const g = gamMap.get(m.id)
    const memberActs = activities.filter(a => a.user_id === m.id)
    return {
      id: m.id,
      name: m.full_name?.split(' ')[0] || 'Utente',
      xp: g?.total_xp || 0,
      streak: g?.streak || 0,
      itemsUsed: memberActs.filter(a => a.action === 'item_used' || a.action === 'item_used_before_expiry').length,
      saved: memberActs.filter(a => a.action === 'item_used_before_expiry').length,
      isCurrentUser: m.id === user.id,
    }
  }).sort((a, b) => b.xp - a.xp)

  // ── Expiry status ──
  const today = new Date().toISOString().split('T')[0]
  const expired = inventory.filter(i => i.expiry_date && i.expiry_date < today)
  const expiringSoon = inventory.filter(i => {
    if (!i.expiry_date) return false
    const days = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86_400_000)
    return days >= 0 && days <= 3
  })

  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      <AnalyticsClient
        stats={{
          totalItems: inventory.length,
          totalEuros: Math.round(totalEuros),
          totalKg: Math.round(totalKg * 10) / 10,
          totalCO2: Math.round(totalCO2 * 10) / 10,
          streak,
          itemsUsed: usedActions.length,
          mealsLogged: mealsLogged.length,
          savedBeforeExpiry: savedBeforeExpiry.length,
          itemsAdded: itemsAdded.length,
          expired: expired.length,
          expiringSoon: expiringSoon.length,
          thisWeekUsed: thisWeekUsed.length,
          thisWeekMeals: thisWeekMeals.length,
          thisWeekSaved: thisWeekSaved.length,
        }}
        weeklyData={weeklyData}
        categoryBreakdown={categoryBreakdown}
        leaderboard={leaderboard}
      />
    </div>
  )
}
