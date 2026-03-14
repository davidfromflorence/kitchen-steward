'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addItem(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) throw new Error('No household')

  const name = formData.get('name') as string
  const quantity = Number(formData.get('quantity')) || 1
  const unit = (formData.get('unit') as string) || 'pz'
  const category = (formData.get('category') as string) || 'General'
  const expiry_date = formData.get('expiry_date') as string | null

  const { error } = await supabase.from('inventory_items').insert([
    {
      household_id: profile.household_id,
      name,
      quantity,
      unit,
      category,
      expiry_date: expiry_date || null,
    },
  ])

  if (error) {
    console.error('Error adding item:', error)
    throw new Error('Failed to add item')
  }

  revalidatePath('/dashboard')
  revalidatePath('/fridge')
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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) throw new Error('No household')

  const rows = items.map((item) => {
    const expiry_date = item.expiry_days
      ? new Date(Date.now() + item.expiry_days * 86400000)
          .toISOString()
          .split('T')[0]
      : null

    return {
      household_id: profile.household_id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      expiry_date,
    }
  })

  const { error } = await supabase.from('inventory_items').insert(rows)

  if (error) {
    console.error('Error adding items:', error)
    throw new Error('Failed to add items')
  }

  revalidatePath('/dashboard')
  revalidatePath('/fridge')
}

export async function deleteItem(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = formData.get('id') as string

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting item:', error)
    throw new Error('Failed to delete item')
  }

  revalidatePath('/dashboard')
  revalidatePath('/fridge')
}

export async function useItem(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = formData.get('id') as string

  const { data: item } = await supabase
    .from('inventory_items')
    .select('quantity')
    .eq('id', id)
    .single()

  if (!item) throw new Error('Item not found')

  if (item.quantity <= 1) {
    await supabase.from('inventory_items').delete().eq('id', id)
  } else {
    await supabase
      .from('inventory_items')
      .update({ quantity: item.quantity - 1 })
      .eq('id', id)
  }

  revalidatePath('/dashboard')
  revalidatePath('/fridge')
}
