import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Home, ArrowRight, LogOut } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { WhatsAppLinkForm } from './whatsapp-link-form'
import ThemePicker from './theme-picker'
import FoodProfileEditor from './food-profile-editor'
import PushToggle from './push-toggle'

function getInitials(name: string | null, email: string | undefined): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return (email?.[0] ?? '?').toUpperCase()
}

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
    .select('full_name, household_id, whatsapp_number')
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

  const initials = getInitials(profile.full_name, user.email)

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
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 px-6 py-5">
          <div className="w-10 h-10 rounded-full bg-olive-100 flex items-center justify-center text-olive-700 font-bold text-sm">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {profile.full_name || 'Not set'}
            </h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-0">
          <div className="py-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Name
            </span>
            <p className="text-slate-800 font-medium mt-1">
              {profile.full_name || 'Not set'}
            </p>
          </div>
          <hr className="border-slate-100" />
          <div className="py-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email
            </span>
            <p className="text-slate-800 font-medium mt-1">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Food Profile */}
      <FoodProfileEditor />

      {/* Household Card */}
      {household && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 px-6 py-5">
            <Home className="w-5 h-5 text-olive-600" />
            <h2 className="text-lg font-bold text-slate-800">Household</h2>
          </div>
          <div className="px-6 py-5 space-y-0">
            <div className="py-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Name
              </span>
              <p className="text-slate-800 font-medium mt-1">
                {household.name}
              </p>
            </div>
            <hr className="border-slate-100" />
            <div className="py-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Join Code
              </span>
              <p className="text-slate-800 font-mono font-bold tracking-wider mt-1">
                {household.join_code}
              </p>
            </div>
            <hr className="border-slate-100" />
            <div className="py-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Members
              </span>
              <p className="text-slate-800 font-medium mt-1">
                {memberCount ?? 0} member{memberCount !== 1 ? 's' : ''}
              </p>
            </div>
            <hr className="border-slate-100" />
            <div className="pt-3">
              <a
                href="/household"
                className="text-olive-600 hover:text-olive-700 font-semibold text-sm inline-flex items-center gap-1"
              >
                Manage household
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <PushToggle />

      {/* Theme */}
      <ThemePicker />

      {/* WhatsApp Integration */}
      <WhatsAppLinkForm phoneNumber={profile.whatsapp_number ?? null} />

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-2xl py-4 font-semibold text-base bg-red-600 hover:bg-red-700 text-white active:scale-95 transition-all inline-flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
