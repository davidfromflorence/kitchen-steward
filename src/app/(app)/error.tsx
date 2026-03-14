'use client'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-md text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-slate-500 mb-1">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 mb-4 font-mono">
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="bg-olive-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-olive-700 active:scale-95 transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
