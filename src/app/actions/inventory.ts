'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { calculateExpiryDate, defaultZone, normalizeZone } from '@/lib/shelf-life'

async function getAuthAndHousehold() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) redirect('/setup')

  return { supabase, householdId: profile.household_id }
}

function revalidateAll() {
  revalidatePath('/dashboard')
  revalidatePath('/fridge')
}

export async function addItem(formData: FormData) {
  const { supabase, householdId } = await getAuthAndHousehold()

  const name = formData.get('name') as string
  const quantity = Number(formData.get('quantity')) || 1
  const unit = (formData.get('unit') as string) || 'pz'
  const category = (formData.get('category') as string) || 'General'
  const manualExpiry = formData.get('expiry_date') as string | null

  const zone = defaultZone(category)
  // Use manual expiry if provided, otherwise calculate from shelf-life
  const expiry_date = manualExpiry || calculateExpiryDate(name, category, zone)

  const { data: inserted, error } = await supabase
    .from('inventory_items')
    .insert([{ household_id: householdId, name, quantity, unit, category, zone, expiry_date }])
    .select()

  if (error) {
    console.error('Error adding item:', error)
    return { error: error.message }
  }

  if (!inserted || inserted.length === 0) {
    return { error: `RLS blocked insert. household_id=${householdId}` }
  }

  revalidateAll()
  return { success: true }
}

export async function addItems(
  items: Array<{
    name: string
    quantity: number
    unit: string
    category: string
    expiry_days?: number
  }>
) {
  const { supabase, householdId } = await getAuthAndHousehold()

  const rows = items.map((item) => {
    const category = item.category || 'General'
    const zone = defaultZone(category)
    // Always use shelf-life map — ignore AI's expiry_days estimate
    const expiry_date = calculateExpiryDate(item.name, category, zone)

    return {
      household_id: householdId,
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || 'pz',
      category,
      zone,
      expiry_date,
    }
  })

  const { data: inserted, error } = await supabase
    .from('inventory_items')
    .insert(rows)
    .select()

  if (error) {
    console.error('Error adding items:', error)
    return { error: error.message }
  }

  if (!inserted || inserted.length === 0) {
    return { error: `RLS blocked insert. household_id=${householdId}, items=${rows.length}` }
  }

  revalidateAll()
  return { success: true }
}

export async function deleteItem(formData: FormData) {
  const { supabase } = await getAuthAndHousehold()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting item:', error)
    return { error: error.message }
  }

  revalidateAll()
  return { success: true }
}

export async function useItem(formData: FormData) {
  const { supabase } = await getAuthAndHousehold()
  const id = formData.get('id') as string

  const { data: item } = await supabase
    .from('inventory_items')
    .select('quantity')
    .eq('id', id)
    .single()

  if (!item) return { error: 'Item not found' }

  if (item.quantity <= 1) {
    await supabase.from('inventory_items').delete().eq('id', id)
  } else {
    await supabase
      .from('inventory_items')
      .update({ quantity: item.quantity - 1 })
      .eq('id', id)
  }

  revalidateAll()
  return { success: true }
}

export async function moveItem(id: string, targetZone: string) {
  const { supabase } = await getAuthAndHousehold()

  const zone = normalizeZone(targetZone)

  // Get item name and category for shelf-life calculation
  const { data: item } = await supabase
    .from('inventory_items')
    .select('name, category')
    .eq('id', id)
    .single()

  const itemName = item?.name || ''
  const category = item?.category || 'General'
  const newExpiry = calculateExpiryDate(itemName, category, zone)

  const { error } = await supabase
    .from('inventory_items')
    .update({ zone, expiry_date: newExpiry })
    .eq('id', id)

  if (error) {
    console.error('Error moving item:', error)
    return { error: error.message }
  }

  revalidateAll()
  return { success: true }
}
