import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from './analytics-client'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('household_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) return redirect('/setup')

  // Fetch inventory items
  const { data: inventoryData } = await supabase
    .from('inventory_items')
    .select('id, name, quantity, unit, category, expiry_date, created_at')
    .eq('household_id', profile.household_id)
    .order('created_at', { ascending: false })

  const inventory = inventoryData ?? []

  // Fetch household members
  const { data: membersData } = await supabase
    .from('users')
    .select('id, full_name, created_at')
    .eq('household_id', profile.household_id)
    .order('created_at', { ascending: true })

  const members = membersData ?? []

  // --- Compute stats from inventory data ---
  const now = new Date()
  const totalItems = inventory.length

  const expiredItems = inventory.filter((item) => {
    if (!item.expiry_date) return false
    return new Date(item.expiry_date) < now
  })
  const savedItems = totalItems - expiredItems.length

  // Zero-waste streak: count consecutive recent days with no expired items
  // We look backwards from today to find how many days had no expirations
  let streak = 0
  for (let d = 0; d < 90; d++) {
    const checkDate = new Date(now)
    checkDate.setDate(checkDate.getDate() - d)
    const dateStr = checkDate.toISOString().split('T')[0]
    const expiredOnDay = inventory.some(
      (item) => item.expiry_date && item.expiry_date.split('T')[0] === dateStr && new Date(item.expiry_date) < now
    )
    if (expiredOnDay) break
    streak++
  }

  // Carbon saved: ~0.5 kg CO2 per item not wasted
  const carbonSaved = Math.round(savedItems * 0.5)

  // Total savings: ~$2.50 per item saved
  const totalSavings = Math.round(savedItems * 2.5 * 100) / 100

  // Family ranking: assign pseudo-scores based on member order (mock since we lack per-user tracking)
  const memberScores = members.map((m, i) => {
    // Give the current user a score based on their saved items, others get mock scores
    const isCurrentUser = m.id === user.id
    const baseScore = isCurrentUser ? savedItems * 10 : Math.max(50, 200 - i * 45)
    return {
      id: m.id,
      name: m.full_name || 'Unknown',
      score: baseScore,
      isCurrentUser,
    }
  })
  memberScores.sort((a, b) => b.score - a.score)
  const currentUserRank = memberScores.findIndex((m) => m.isCurrentUser) + 1

  // Monthly data (mock based on item count, simulating last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthLabel = monthNames[d.getMonth()]
    // Items created in that month
    const monthItems = inventory.filter((item) => {
      if (!item.created_at) return false
      const created = new Date(item.created_at)
      return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear()
    })
    // If we have real data use it, otherwise generate mock data that trends upward
    const waste = monthItems.length > 0
      ? Math.round(monthItems.length * 0.8)
      : Math.round(8 + (5 - i) * 3 + Math.random() * 5)
    const savings = monthItems.length > 0
      ? Math.round(monthItems.length * 2.5)
      : Math.round(120 + (5 - i) * 35 + Math.random() * 20)
    monthlyData.push({ month: monthLabel, wasteSaved: waste, savings })
  }

  // Category breakdown from inventory
  const categoryCounts: Record<string, number> = {}
  for (const item of inventory) {
    const cat = item.category || 'Other'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  }
  const sortedCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
  const categoryTotal = sortedCategories.reduce((sum, [, count]) => sum + count, 0) || 1
  const categoryBreakdown = sortedCategories.length > 0
    ? sortedCategories.map(([name, count]) => ({
        name: formatCategoryName(name),
        percentage: Math.round((count / categoryTotal) * 100),
      }))
    : [
        { name: 'Leafy Greens', percentage: 45 },
        { name: 'Bread & Grains', percentage: 25 },
        { name: 'Dairy', percentage: 20 },
        { name: 'Fruits', percentage: 10 },
      ]

  // Badges (mock milestone system)
  const badges = [
    { label: `${Math.min(streak, 10)}-Day Streak`, icon: 'flame', unlocked: streak >= 10 },
    { label: '$100 Saved', icon: 'dollar', unlocked: totalSavings >= 100 },
    { label: 'Master Composter', icon: 'leaf', unlocked: savedItems >= 50 },
    { label: 'Eco Gold (50%)', icon: 'trophy', unlocked: savedItems > totalItems * 0.5 },
    { label: 'First Item', icon: 'star', unlocked: totalItems > 0 },
    { label: '25 Items Tracked', icon: 'package', unlocked: totalItems >= 25 },
  ]

  const stats = {
    streak,
    carbonSaved,
    totalSavings,
    currentUserRank,
    totalMembers: members.length,
    savedItems,
    totalItems,
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      <AnalyticsClient
        stats={stats}
        members={memberScores}
        monthlyData={monthlyData}
        categoryBreakdown={categoryBreakdown}
        badges={badges}
      />
    </div>
  )
}

function formatCategoryName(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower === 'vegetable') return 'Leafy Greens'
  if (lower === 'fruit') return 'Fruits'
  if (lower === 'dairy') return 'Dairy'
  if (lower === 'protein') return 'Proteins'
  if (lower === 'carbohydrate') return 'Bread & Grains'
  if (lower === 'beverage' || lower === 'beverages') return 'Beverages'
  if (lower === 'frozen') return 'Frozen'
  if (lower === 'condiment') return 'Condiments'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}
