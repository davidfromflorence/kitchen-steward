'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
  const expiry_date = formData.get('expiry_date') as string | null

  const cat = category.toLowerCase()
  const zone = cat === 'frozen' ? 'freezer'
    : ['carbohydrate', 'condiment'].includes(cat) ? 'pantry'
    : 'fridge'

  const { data: inserted, error } = await supabase
    .from('inventory_items')
    .insert([
      {
        household_id: householdId,
        name,
        quantity,
        unit,
        category,
        zone,
        expiry_date: expiry_date || null,
      },
    ])
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
    const expiry_date = item.expiry_days
      ? new Date(Date.now() + item.expiry_days * 86400000)
          .toISOString()
          .split('T')[0]
      : null

    // Default zone based on food category
    const cat = (item.category || 'General').toLowerCase()
    const zone = cat === 'frozen' ? 'freezer'
      : ['carbohydrate', 'condiment'].includes(cat) ? 'pantry'
      : 'fridge'

    return {
      household_id: householdId,
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || 'pz',
      category: item.category || 'General',
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
  const { calculateExpiryDate, normalizeZone } = await import('@/lib/shelf-life')

  const zone = normalizeZone(targetZone)

  // Get current item's food category for shelf-life calculation
  const { data: item } = await supabase
    .from('inventory_items')
    .select('category')
    .eq('id', id)
    .single()

  const foodCategory = item?.category || 'General'
  const newExpiry = calculateExpiryDate(foodCategory, zone)

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
