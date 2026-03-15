import { login, signup } from './actions'
import { Leaf } from 'lucide-react'

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

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
        <a
          href="/login"
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-center transition-all ${
            !isSignIn ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Create Account
        </a>
        <a
          href="/login?tab=signin"
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-center transition-all ${
            isSignIn ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Sign In
        </a>
      </div>

      {/* Sign Up */}
      {!isSignIn && (
        <form action={signup} className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-slate-700">
            Your Name
          </label>
          <input
            className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-500 transition-all"
            name="full_name"
            placeholder="e.g. David"
            required
          />
          <label className="text-sm font-semibold text-slate-700 mt-2">
            Email
          </label>
          <input
            className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-500 transition-all"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
          <label className="text-sm font-semibold text-slate-700 mt-2">
            Password
          </label>
          <input
            className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-500 transition-all"
            type="password"
            name="password"
            placeholder="At least 6 characters"
            minLength={6}
            required
          />
          <button
            type="submit"
            className="mt-4 bg-olive-600 hover:bg-olive-700 text-white rounded-xl py-3 font-semibold active:scale-95 transition-all"
          >
            Create Free Account
          </button>
        </form>
      )}

      {/* Sign In */}
      {isSignIn && (
        <form action={login} className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-slate-700">
            Email
          </label>
          <input
            className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-500 transition-all"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
          <label className="text-sm font-semibold text-slate-700 mt-2">
            Password
          </label>
          <input
            className="rounded-xl px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-olive-500 transition-all"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
          <button
            type="submit"
            className="mt-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-semibold active:scale-95 transition-all"
          >
            Sign In
          </button>
        </form>
      )}

      {message && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 text-center rounded-xl text-sm font-medium">
          {message}
        </div>
      )}
    </div>
  )
}
