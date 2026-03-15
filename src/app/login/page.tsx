import { login, signup } from './actions'
import { Leaf } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; tab?: string }>
}) {
  const { message, tab } = await searchParams
  const isSignIn = tab === 'signin'

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md mx-auto justify-center gap-2 mt-16">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-olive-100 p-3 rounded-2xl mb-4">
          <Leaf className="w-10 h-10 text-olive-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Kitchen Steward</h1>
        <p className="text-slate-500 mt-2 text-center text-sm">
          The smart family fridge that pays for itself.
        </p>
      </div>

      {/* Tabs (link-based for server rendering, styled like shadcn TabsList) */}
      <div className="inline-flex w-full items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground h-10 mb-6">
        <a
          href="/login"
          className={`inline-flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
            !isSignIn
              ? 'bg-background text-foreground shadow-sm'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Create Account
        </a>
        <a
          href="/login?tab=signin"
          className={`inline-flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
            isSignIn
              ? 'bg-background text-foreground shadow-sm'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Sign In
        </a>
      </div>

      <Card className="border-0 shadow-none bg-transparent ring-0">
        <CardContent className="px-0">
          {/* Sign Up */}
          {!isSignIn && (
            <form className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Your Name
              </label>
              <Input
                className="rounded-xl px-4 py-3 h-auto bg-slate-50 border-slate-200 focus-visible:ring-olive-500/50 focus-visible:border-olive-500"
                name="full_name"
                placeholder="e.g. David"
                required
              />
              <label className="text-sm font-semibold text-slate-700 mt-2">
                Email
              </label>
              <Input
                className="rounded-xl px-4 py-3 h-auto bg-slate-50 border-slate-200 focus-visible:ring-olive-500/50 focus-visible:border-olive-500"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
              <label className="text-sm font-semibold text-slate-700 mt-2">
                Password
              </label>
              <Input
                className="rounded-xl px-4 py-3 h-auto bg-slate-50 border-slate-200 focus-visible:ring-olive-500/50 focus-visible:border-olive-500"
                type="password"
                name="password"
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
              <button
                formAction={signup}
                className="mt-4 bg-olive-600 hover:bg-olive-700 text-white rounded-xl py-3 font-semibold active:scale-95 transition-all w-full"
              >
                Create Free Account
              </button>
            </form>
          )}

          {/* Sign In */}
          {isSignIn && (
            <form className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Email
              </label>
              <Input
                className="rounded-xl px-4 py-3 h-auto bg-slate-50 border-slate-200 focus-visible:ring-olive-500/50 focus-visible:border-olive-500"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
              <label className="text-sm font-semibold text-slate-700 mt-2">
                Password
              </label>
              <Input
                className="rounded-xl px-4 py-3 h-auto bg-slate-50 border-slate-200 focus-visible:ring-olive-500/50 focus-visible:border-olive-500"
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
              <button
                formAction={login}
                className="mt-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-semibold active:scale-95 transition-all w-full"
              >
                Sign In
              </button>
            </form>
          )}
        </CardContent>
      </Card>

      {message && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 text-center rounded-xl text-sm font-medium">
          {message}
        </div>
      )}
    </div>
  )
}
