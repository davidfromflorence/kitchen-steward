'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="it">
      <body className="bg-stone-50 flex items-center justify-center min-h-screen px-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-md text-center">
          <div className="text-4xl mb-4">:(</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Qualcosa è andato storto
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Si è verificato un errore imprevisto. Riprova o torna alla home.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Ref: {error.digest}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-olive-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-olive-700 active:scale-95 transition-all"
            >
              Riprova
            </button>
            <a
              href="/"
              className="border border-slate-300 text-slate-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
