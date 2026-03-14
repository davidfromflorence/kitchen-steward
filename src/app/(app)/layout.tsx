import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Sidebar from './sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) {
    redirect('/setup')
  }

  const userName = profile.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar userName={userName} userRole="Household Head" />

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
