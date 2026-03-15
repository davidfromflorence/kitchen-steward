import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Home, ArrowRight, LogOut } from 'lucide-react'
import { logout } from '@/app/login/actions'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { WhatsAppLinkForm } from './whatsapp-link-form'

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
    .select('full_name, household_id, phone_number')
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
      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex-row items-center gap-3 px-6 py-5">
          <Avatar size="lg" className="bg-olive-100">
            <AvatarFallback className="bg-olive-100 text-olive-700 font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">
              {profile.full_name || 'Not set'}
            </CardTitle>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-5 space-y-0">
          <div className="py-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Name
            </span>
            <p className="text-slate-800 font-medium mt-1">
              {profile.full_name || 'Not set'}
            </p>
          </div>
          <Separator className="bg-slate-100" />
          <div className="py-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email
            </span>
            <p className="text-slate-800 font-medium mt-1">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Household Card */}
      {household && (
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex-row items-center gap-2 px-6 py-5">
            <Home className="w-5 h-5 text-olive-600" />
            <CardTitle className="text-lg font-bold text-slate-800">
              Household
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-5 space-y-0">
            <div className="py-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Name
              </span>
              <p className="text-slate-800 font-medium mt-1">
                {household.name}
              </p>
            </div>
            <Separator className="bg-slate-100" />
            <div className="py-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Join Code
              </span>
              <p className="text-slate-800 font-mono font-bold tracking-wider mt-1">
                {household.join_code}
              </p>
            </div>
            <Separator className="bg-slate-100" />
            <div className="py-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Members
              </span>
              <p className="text-slate-800 font-medium mt-1">
                {memberCount ?? 0} member{memberCount !== 1 ? 's' : ''}
              </p>
            </div>
            <Separator className="bg-slate-100" />
            <div className="pt-3">
              <Button
                variant="link"
                className="text-olive-600 hover:text-olive-700 p-0 h-auto font-semibold"
                render={<a href="/household" />}
              >
                Manage household
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp Integration */}
      <WhatsAppLinkForm phoneNumber={profile.phone_number ?? null} />

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <form action={logout}>
          <Button
            type="submit"
            variant="destructive"
            size="lg"
            className="w-full rounded-2xl py-4 h-auto font-semibold text-base"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  )
}
