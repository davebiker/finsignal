export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-pulse">

      {/* Page header skeleton */}
      <div>
        <div className="h-3 w-32 bg-surface-3 rounded mb-2" />
        <div className="h-8 w-48 bg-surface-3 rounded mb-2" />
        <div className="h-4 w-64 bg-surface-3 rounded" />
      </div>

      {/* Market overview skeleton */}
      <section>
        <div className="h-4 w-28 bg-surface-3 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="h-3 w-16 bg-surface-3 rounded" />
              <div className="h-6 w-24 bg-surface-3 rounded" />
              <div className="h-3 w-12 bg-surface-3 rounded" />
            </div>
          ))}
        </div>
      </section>

      <div className="glow-line opacity-30" />

      {/* Two-column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-4 w-20 bg-surface-3 rounded" />
          <div className="card overflow-hidden">
            <div className="p-4 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-surface-3 rounded-lg" />
                    <div className="space-y-1">
                      <div className="h-4 w-14 bg-surface-3 rounded" />
                      <div className="h-3 w-24 bg-surface-3 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="h-4 w-16 bg-surface-3 rounded" />
                    <div className="h-4 w-12 bg-surface-3 rounded" />
                    <div className="h-4 w-14 bg-surface-3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Earnings sidebar skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-36 bg-surface-3 rounded" />
          <div className="card p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-surface-3 rounded" />
                  <div className="h-3 w-20 bg-surface-3 rounded" />
                </div>
                <div className="h-3 w-16 bg-surface-3 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glow-line opacity-30" />

      {/* Recent analyses skeleton */}
      <section>
        <div className="h-4 w-36 bg-surface-3 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-surface-3 rounded-lg" />
                <div className="h-4 w-20 bg-surface-3 rounded" />
              </div>
              <div className="h-3 w-full bg-surface-3 rounded" />
              <div className="h-3 w-3/4 bg-surface-3 rounded" />
              <div className="h-3 w-16 bg-surface-3 rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
