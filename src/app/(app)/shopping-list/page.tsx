import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ShoppingClient from './shopping-client'

export default async function ShoppingListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await admin
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) return redirect('/setup')

  // Fetch inventory for smart generation
  const { data: inventoryData } = await admin
    .from('inventory_items')
    .select('name, quantity, unit, category, expiry_date')
    .eq('household_id', profile.household_id)
    .order('expiry_date', { ascending: true })

  // Fetch existing shopping list
  const { data: listData } = await admin
    .from('shopping_list_items')
    .select('id, name, category, notes, checked')
    .eq('household_id', profile.household_id)
    .order('checked', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="animate-in pb-28">
      <ShoppingClient
        inventory={inventoryData || []}
        listItems={listData || []}
      />
    </div>
  )
}
