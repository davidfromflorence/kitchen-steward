import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Users, ArrowRight, Crown } from 'lucide-react'
import CopyCodeButton from './copy-code-button'

export default async function HouseholdPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; code?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  // Fetch user profile with household info
  const { data: profile } = await supabase
    .from('users')
    .select('household_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) return redirect('/setup')

  // Fetch household details
  const { data: household } = await supabase
    .from('households')
    .select('id, name, join_code, created_at')
    .eq('id', profile.household_id)
    .single()

  if (!household) return redirect('/setup')

  // Fetch all members in this household
  const { data: members } = await supabase
    .from('users')
    .select('id, full_name, created_at')
    .eq('household_id', household.id)
    .order('created_at', { ascending: true })

  const { welcome, code } = await searchParams
  const isWelcome = welcome === 'true'
  const joinCode = code || household.join_code

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-lg mx-auto py-8 gap-6 animate-in pb-28">
      {/* Welcome Banner (only after creating) */}
      {isWelcome && (
        <div className="bg-olive-50 border border-olive-200 p-6 rounded-3xl text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h1 className="text-2xl font-bold text-olive-800 mb-2">
            Household Created!
          </h1>
          <p className="text-olive-600 text-sm">
            Share the invite code below with your family members so they can
            join your fridge.
          </p>
        </div>
      )}

      {/* Household Header */}
      {!isWelcome && (
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-olive-600" />
            {household.name}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your household members and invite code.
          </p>
        </div>
      )}

      {/* Invite Code Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
          Codice invito
        </h2>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-center mb-3">
          <span className="text-2xl font-mono font-bold tracking-[0.25em] text-slate-900">
            {joinCode}
          </span>
        </div>
        <CopyCodeButton code={joinCode} />
        <p className="text-xs text-slate-400 mt-3 text-center">
          Condividi il codice o il link con i tuoi familiari.
        </p>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Members</h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            {members?.length || 0}
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {members?.map((member, index) => (
            <div key={member.id} className="px-6 py-4 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-olive-50 text-olive-600'
                }`}
              >
                {member.full_name
                  ? member.full_name.charAt(0).toUpperCase()
                  : '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    {member.full_name || 'Unknown'}
                  </span>
                  {member.id === user.id && (
                    <span className="text-[10px] font-bold text-olive-600 bg-olive-50 px-1.5 py-0.5 rounded">
                      YOU
                    </span>
                  )}
                  {index === 0 && (
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  Joined {new Date(member.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button (welcome only) */}
      {isWelcome && (
        <a
          href="/dashboard"
          className="w-full bg-olive-600 text-white rounded-2xl py-4 font-semibold shadow-lg hover:bg-olive-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Go to My Fridge
          <ArrowRight className="w-5 h-5" />
        </a>
      )}

    </div>
  )
}
