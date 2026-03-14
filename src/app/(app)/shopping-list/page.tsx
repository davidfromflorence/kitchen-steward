import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ShoppingClient from './shopping-client'
import type { SuggestionItem, ShoppingItem } from './shopping-client'

export default async function ShoppingListPage() {
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

  // Fetch inventory items for suggestions (expired or low quantity)
  const { data: inventoryData } = await supabase
    .from('inventory_items')
    .select('id, name, category, quantity, unit, expiry_date')
    .eq('household_id', profile.household_id)
    .order('expiry_date', { ascending: true })

  const inventory = inventoryData || []

  // Build suggestions from expired or low-quantity inventory items
  const suggestions: SuggestionItem[] = []
  const now = Date.now()

  for (const item of inventory) {
    if (suggestions.length >= 6) break

    const daysUntilExpiry = item.expiry_date
      ? Math.ceil(
          (new Date(item.expiry_date).getTime() - now) / 86400000
        )
      : null

    if (daysUntilExpiry !== null && daysUntilExpiry < 0) {
      const daysAgo = Math.abs(daysUntilExpiry)
      suggestions.push({
        id: item.id,
        name: item.name,
        category: item.category || 'General',
        status:
          daysAgo === 1
            ? 'EXPIRED YESTERDAY'
            : `EXPIRED ${daysAgo}D AGO`,
        borderColor: '#dc2626', // red
      })
    } else if (daysUntilExpiry !== null && daysUntilExpiry === 0) {
      suggestions.push({
        id: item.id,
        name: item.name,
        category: item.category || 'General',
        status: 'EXPIRES TODAY',
        borderColor: '#ea580c', // orange
      })
    } else if (item.quantity <= 1) {
      suggestions.push({
        id: item.id,
        name: item.name,
        category: item.category || 'General',
        status: 'RUNNING LOW',
        borderColor: '#d97706', // amber
      })
    }
  }

  // Fetch shopping list items — gracefully handle table not existing
  let listItems: ShoppingItem[] = []

  try {
    const { data: shoppingData, error } = await supabase
      .from('shopping_list_items')
      .select('id, name, category, notes, checked')
      .eq('household_id', profile.household_id)
      .order('checked', { ascending: true })
      .order('created_at', { ascending: false })

    if (!error && shoppingData) {
      listItems = shoppingData
    }
  } catch {
    // Table may not exist yet — show empty list
  }

  // Inventory names for "In Fridge" badge detection
  const inventoryNames = inventory.map((i) => i.name)

  return (
    <div className="flex flex-col gap-6 animate-in py-8 max-w-2xl mx-auto px-6 pb-28">
      <ShoppingClient
        suggestions={suggestions}
        listItems={listItems}
        inventoryNames={inventoryNames}
      />
    </div>
  )
}
