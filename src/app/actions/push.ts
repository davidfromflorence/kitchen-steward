'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function savePushSubscription(subscription: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Store subscription JSON in users table
  await supabase
    .from('users')
    .update({ push_subscription: subscription })
    .eq('id', user.id)
}

export async function removePushSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('users')
    .update({ push_subscription: null })
    .eq('id', user.id)
}
