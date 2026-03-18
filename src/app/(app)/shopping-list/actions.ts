'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getHouseholdId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = getAdmin()
  const { data: profile } = await admin
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()
  if (!profile?.household_id) throw new Error('No household')
  return { admin, householdId: profile.household_id }
}

export async function addShoppingItem(formData: FormData) {
  const { admin, householdId } = await getHouseholdId()
  const name = formData.get('name') as string
  const category = (formData.get('category') as string) || 'General'
  const notes = (formData.get('notes') as string) || null

  if (!name?.trim()) return

  await admin.from('shopping_list_items').insert([{
    household_id: householdId,
    name: name.trim(),
    category,
    notes,
    checked: false,
  }])

  revalidatePath('/shopping-list')
}

export async function toggleShoppingItem(formData: FormData) {
  const { admin } = await getHouseholdId()
  const id = formData.get('id') as string
  const checked = formData.get('checked') === 'true'

  await admin.from('shopping_list_items').update({ checked: !checked }).eq('id', id)
  revalidatePath('/shopping-list')
}

export async function deleteShoppingItem(formData: FormData) {
  const { admin } = await getHouseholdId()
  const id = formData.get('id') as string
  await admin.from('shopping_list_items').delete().eq('id', id)
  revalidatePath('/shopping-list')
}

export async function clearCheckedItems() {
  const { admin, householdId } = await getHouseholdId()
  await admin.from('shopping_list_items').delete().eq('household_id', householdId).eq('checked', true)
  revalidatePath('/shopping-list')
}

export async function saveGeneratedList(
  items: Array<{ name: string; qty: string; price: number; aisle: string }>
) {
  const { admin, householdId } = await getHouseholdId()

  // Check what already exists
  const { data: existing } = await admin
    .from('shopping_list_items')
    .select('name')
    .eq('household_id', householdId)
    .eq('checked', false)

  const existingNames = new Set((existing || []).map(i => i.name.toLowerCase()))

  const newItems = items
    .filter(i => !existingNames.has(i.name.toLowerCase()))
    .map(i => ({
      household_id: householdId,
      name: i.name,
      category: i.aisle,
      notes: `${i.qty} · ~€${i.price.toFixed(2)}`,
      checked: false,
    }))

  if (newItems.length > 0) {
    await admin.from('shopping_list_items').insert(newItems)
  }

  revalidatePath('/shopping-list')
  return { added: newItems.length }
}
