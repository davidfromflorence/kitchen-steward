import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LearnClient from './learn-client'

export default async function LearnPage() {
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

  return <LearnClient />
}
