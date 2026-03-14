import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createHousehold, joinHousehold } from './actions'
import { Leaf, Home, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Double check if user already has a household
  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (profile?.household_id) {
    return redirect('/dashboard')
  }

  const { error } = await searchParams

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-lg mx-auto justify-center gap-2 mt-16 animate-in">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-olive-100 p-3 rounded-2xl mb-4">
          <Leaf className="w-10 h-10 text-olive-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Final Step!</h1>
        <p className="text-slate-500 mt-2 text-center text-sm">
          To manage your inventory, you need to join or create a Family Fridge.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Create Household */}
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-olive-50 rounded-lg text-olive-600">
                <Home className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                Create New Fridge
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <form action={createHousehold} className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-slate-700">
                Family/Household Name
              </label>
              <Input
                className="rounded-xl px-4 py-3 h-auto bg-slate-50 border-slate-200 focus-visible:ring-olive-500/50 focus-visible:border-olive-500"
                name="name"
                placeholder="e.g. Bottai Family"
                required
              />
              <Button className="bg-olive-600 hover:bg-olive-700 text-white rounded-xl h-auto py-3 font-semibold transition-all">
                Create & Start
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-cream px-2 text-slate-400 font-bold">OR</span>
          </div>
        </div>

        {/* Join Household */}
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                Join Existing Fridge
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <form action={joinHousehold} className="flex flex-col gap-4">
              <label className="text-sm font-semibold text-slate-700">
                Invite Code
              </label>
              <Input
                className="rounded-xl px-4 py-3 h-auto bg-slate-50 border-slate-200 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 uppercase tracking-widest"
                name="join_code"
                placeholder="8-CHAR CODE"
                required
              />
              <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-auto py-3 font-semibold transition-all">
                Join Household
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 text-center rounded-xl text-sm font-medium">
          {error}
        </div>
      )}
    </div>
  )
}
