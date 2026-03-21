export default function AnalyticsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 animate-pulse">
      <div className="h-7 w-32 bg-slate-200 rounded-lg mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="h-3 w-16 bg-slate-100 rounded mb-2" />
            <div className="h-6 w-12 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
        <div className="h-5 w-36 bg-slate-200 rounded mb-4" />
        <div className="h-40 w-full bg-slate-100 rounded-xl" />
      </div>
    </div>
  )
}
