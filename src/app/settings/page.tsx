import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, User, Home, ArrowRight, LogOut } from 'lucide-react'
import { logout } from '@/app/login/actions'
import NavBar from '@/app/components/nav-bar'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) {
    return redirect('/setup')
  }

  const { data: household } = await supabase
    .from('households')
    .select('id, name, join_code')
    .eq('id', profile.household_id)
    .single()

  const { count: memberCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', profile.household_id)

  return (
    <div className="flex flex-col gap-6 animate-in py-8 max-w-2xl mx-auto px-6 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
          <Settings className="w-6 h-6 text-olive-600" />
          Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your profile and household.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <User className="w-5 h-5 text-olive-600" />
          <h2 className="text-lg font-bold text-slate-800">Profile</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Name
            </span>
            <p className="text-slate-800 font-medium mt-1">
              {profile.full_name || 'Not set'}
            </p>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email
            </span>
            <p className="text-slate-800 font-medium mt-1">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Household Card */}
      {household && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Home className="w-5 h-5 text-olive-600" />
            <h2 className="text-lg font-bold text-slate-800">Household</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Name
              </span>
              <p className="text-slate-800 font-medium mt-1">
                {household.name}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Join Code
              </span>
              <p className="text-slate-800 font-mono font-bold tracking-wider mt-1">
                {household.join_code}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Members
              </span>
              <p className="text-slate-800 font-medium mt-1">
                {memberCount ?? 0} member{memberCount !== 1 ? 's' : ''}
              </p>
            </div>
            <a
              href="/household"
              className="inline-flex items-center gap-2 text-sm font-semibold text-olive-600 hover:text-olive-700 transition-colors"
            >
              Manage household
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <form action={logout}>
          <button
            type="submit"
            className="w-full bg-white text-red-600 border border-red-200 rounded-2xl py-4 font-semibold hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </form>

      </div>

      <NavBar />
    </div>
  )
}
