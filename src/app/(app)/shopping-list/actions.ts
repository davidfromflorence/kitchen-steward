'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function getHouseholdId() {
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

  return { supabase, householdId: profile.household_id }
}

export async function addShoppingItem(formData: FormData) {
  const { supabase, householdId } = await getHouseholdId()

  const name = formData.get('name') as string
  const category = (formData.get('category') as string) || 'General'
  const notes = (formData.get('notes') as string) || null

  if (!name?.trim()) throw new Error('Name is required')

  const { error } = await supabase.from('shopping_list_items').insert([
    {
      household_id: householdId,
      name: name.trim(),
      category,
      notes,
      checked: false,
    },
  ])

  if (error) {
    console.error('Error adding shopping item:', error)
    throw new Error('Failed to add item')
  }

  revalidatePath('/shopping-list')
}

export async function toggleShoppingItem(formData: FormData) {
  const { supabase } = await getHouseholdId()

  const id = formData.get('id') as string
  const checked = formData.get('checked') === 'true'

  const { error } = await supabase
    .from('shopping_list_items')
    .update({ checked: !checked })
    .eq('id', id)

  if (error) {
    console.error('Error toggling shopping item:', error)
    throw new Error('Failed to toggle item')
  }

  revalidatePath('/shopping-list')
}

export async function deleteShoppingItem(formData: FormData) {
  const { supabase } = await getHouseholdId()

  const id = formData.get('id') as string

  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting shopping item:', error)
    throw new Error('Failed to delete item')
  }

  revalidatePath('/shopping-list')
}

export async function addSuggestionToList(formData: FormData) {
  const { supabase, householdId } = await getHouseholdId()

  const name = formData.get('name') as string
  const category = (formData.get('category') as string) || 'General'
  const notes = (formData.get('notes') as string) || null

  if (!name?.trim()) throw new Error('Name is required')

  const { error } = await supabase.from('shopping_list_items').insert([
    {
      household_id: householdId,
      name: name.trim(),
      category,
      notes,
      checked: false,
    },
  ])

  if (error) {
    console.error('Error adding suggestion to list:', error)
    throw new Error('Failed to add suggestion')
  }

  revalidatePath('/shopping-list')
}
