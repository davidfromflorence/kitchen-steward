export default function RecipesLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 animate-pulse">
      <div className="h-7 w-36 bg-slate-200 rounded-lg mb-2" />
      <div className="h-4 w-56 bg-slate-100 rounded-lg mb-6" />
      <div className="h-12 w-full bg-slate-100 rounded-xl mb-6" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="h-5 w-40 bg-slate-200 rounded mb-3" />
            <div className="h-4 w-full bg-slate-100 rounded mb-2" />
            <div className="h-4 w-3/4 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
