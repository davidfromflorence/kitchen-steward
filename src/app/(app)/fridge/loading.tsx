export default function FridgeLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 animate-pulse">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="h-7 w-32 bg-slate-200 rounded-lg" />
          <div className="h-4 w-24 bg-slate-100 rounded-lg mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-slate-200 rounded-xl" />
          <div className="h-9 w-24 bg-slate-200 rounded-xl" />
        </div>
      </div>
      <div className="flex gap-2 mb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-slate-100 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="h-24 bg-slate-100" />
            <div className="p-3">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-3 w-14 bg-slate-100 rounded mt-2" />
              <div className="h-3 w-16 bg-slate-100 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
