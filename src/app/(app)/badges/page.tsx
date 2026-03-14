import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BadgesClient from './badges-client'

export interface Badge {
  id: string
  name: string
  description: string
  emoji: string
  unlocked: boolean
  progress: { current: number; target: number; unit: string }
}

export default async function BadgesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) return redirect('/setup')

  // Fetch inventory data
  const { data: inventoryData } = await supabase
    .from('inventory_items')
    .select('id, name, category, expiry_date, created_at')
    .eq('household_id', profile.household_id)

  const inventory = inventoryData ?? []
  const itemCount = inventory.length

  // Fetch household members
  const { data: members } = await supabase
    .from('users')
    .select('id')
    .eq('household_id', profile.household_id)

  const memberCount = members?.length ?? 1

  // Mock derived stats
  const usedBeforeExpiry = Math.floor(itemCount * 0.4)
  const recipesGenerated = 2
  const categorizedItems = itemCount
  const foodSavedKg = Math.round(itemCount * 0.3 * 10) / 10
  const moneySaved = Math.round(itemCount * 8.5)

  // Compute streak (mock: based on recent items with valid expiry)
  const recentItems = inventory.filter((item) => {
    if (!item.expiry_date) return false
    const expiry = new Date(item.expiry_date)
    return expiry.getTime() > Date.now()
  })
  const streakDays = Math.min(recentItems.length, 14)

  // Define badge system
  const allBadges: Badge[] = [
    {
      id: 'first-item',
      name: 'First Item',
      description: 'Add your first item to the fridge',
      emoji: '\uD83E\uDD5A',
      unlocked: itemCount >= 1,
      progress: { current: Math.min(itemCount, 1), target: 1, unit: 'item' },
    },
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Add 5 items to your inventory',
      emoji: '\uD83D\uDCE6',
      unlocked: itemCount >= 5,
      progress: { current: Math.min(itemCount, 5), target: 5, unit: 'items' },
    },
    {
      id: 'stocked-up',
      name: 'Stocked Up',
      description: 'Add 20 items to your inventory',
      emoji: '\uD83D\uDED2',
      unlocked: itemCount >= 20,
      progress: { current: Math.min(itemCount, 20), target: 20, unit: 'items' },
    },
    {
      id: 'zero-waste-hero',
      name: 'Zero Waste Hero',
      description: 'Use 10 items before they expire',
      emoji: '\u267B\uFE0F',
      unlocked: usedBeforeExpiry >= 10,
      progress: { current: Math.min(usedBeforeExpiry, 10), target: 10, unit: 'items' },
    },
    {
      id: 'recipe-explorer',
      name: 'Recipe Explorer',
      description: 'Generate 5 recipes from your ingredients',
      emoji: '\uD83D\uDCD6',
      unlocked: recipesGenerated >= 5,
      progress: { current: recipesGenerated, target: 5, unit: 'recipes' },
    },
    {
      id: 'family-chef',
      name: 'Family Chef',
      description: 'Have 3 or more household members',
      emoji: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66',
      unlocked: memberCount >= 3,
      progress: { current: Math.min(memberCount, 3), target: 3, unit: 'members' },
    },
    {
      id: '7-day-streak',
      name: '7-Day Streak',
      description: '7 days without any expired items',
      emoji: '\uD83D\uDD25',
      unlocked: streakDays >= 7,
      progress: { current: Math.min(streakDays, 7), target: 7, unit: 'days' },
    },
    {
      id: '30-day-streak',
      name: '30-Day Streak',
      description: '30 days without any expired items',
      emoji: '\u26A1',
      unlocked: streakDays >= 30,
      progress: { current: Math.min(streakDays, 30), target: 30, unit: 'days' },
    },
    {
      id: 'eco-warrior',
      name: 'Eco Warrior',
      description: 'Save 50 kg of food from going to waste',
      emoji: '\uD83C\uDF0D',
      unlocked: foodSavedKg >= 50,
      progress: { current: Math.min(foodSavedKg, 50), target: 50, unit: 'kg' },
    },
    {
      id: 'master-composter',
      name: 'Master Composter',
      description: 'Categorize 50 items correctly',
      emoji: '\uD83C\uDF31',
      unlocked: categorizedItems >= 50,
      progress: { current: Math.min(categorizedItems, 50), target: 50, unit: 'items' },
    },
    {
      id: 'budget-boss',
      name: 'Budget Boss',
      description: 'Save $500 on groceries by reducing waste',
      emoji: '\uD83D\uDCB0',
      unlocked: moneySaved >= 500,
      progress: { current: Math.min(moneySaved, 500), target: 500, unit: 'dollars' },
    },
  ]

  // Kitchen Legend: unlocked only if all other badges are unlocked
  const allOthersUnlocked = allBadges.every((b) => b.unlocked)
  allBadges.push({
    id: 'kitchen-legend',
    name: 'Kitchen Legend',
    description: 'Complete all other badges to earn this title',
    emoji: '\uD83D\uDC51',
    unlocked: allOthersUnlocked,
    progress: {
      current: allBadges.filter((b) => b.unlocked).length,
      target: allBadges.length,
      unit: 'badges',
    },
  })

  const totalUnlocked = allBadges.filter((b) => b.unlocked).length
  const totalBadges = allBadges.length

  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      <BadgesClient
        badges={allBadges}
        totalUnlocked={totalUnlocked}
        totalBadges={totalBadges}
        streakDays={streakDays}
      />
    </div>
  )
}
