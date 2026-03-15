import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import FridgeClient from './fridge-client'

export default async function FridgePage() {
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

  const { data: inventoryData } = await supabase
    .from('inventory_items')
    .select('id, name, quantity, unit, category, zone, expiry_date')
    .eq('household_id', profile.household_id)
    .order('expiry_date', { ascending: true })

  const inventory = inventoryData ?? []

  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      <FridgeClient items={inventory} />
    </div>
  )
}
