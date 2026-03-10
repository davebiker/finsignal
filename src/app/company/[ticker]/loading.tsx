export default function CompanyLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-pulse">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 bg-surface-3 rounded" />
        <div className="h-3 w-2 bg-surface-3 rounded" />
        <div className="h-3 w-12 bg-surface-3 rounded" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-surface-3 rounded-xl shrink-0" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-surface-3 rounded" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-14 bg-surface-3 rounded" />
              <div className="h-4 w-20 bg-surface-3 rounded" />
              <div className="h-4 w-16 bg-surface-3 rounded" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-9 w-28 bg-surface-3 rounded" />
          <div className="h-4 w-20 bg-surface-3 rounded" />
          <div className="h-8 w-24 bg-surface-3 rounded-lg" />
        </div>
      </div>

      {/* 52W range */}
      <div className="card p-4 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-surface-3 rounded" />
          <div className="h-3 w-20 bg-surface-3 rounded" />
          <div className="h-3 w-24 bg-surface-3 rounded" />
        </div>
        <div className="h-2 w-full bg-surface-3 rounded-full" />
      </div>

      <div className="glow-line opacity-30" />

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <div className="h-3 w-16 bg-surface-3 rounded" />
            <div className="h-6 w-20 bg-surface-3 rounded" />
          </div>
        ))}
      </div>

      {/* Earnings + Analyst */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-5 w-32 bg-surface-3 rounded" />
                <div className="h-3 w-20 bg-surface-3 rounded" />
              </div>
              <div className="flex gap-1">
                <div className="h-7 w-16 bg-surface-3 rounded-md" />
                <div className="h-7 w-20 bg-surface-3 rounded-md" />
                <div className="h-7 w-14 bg-surface-3 rounded-md" />
              </div>
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="h-4 w-16 bg-surface-3 rounded" />
                  <div className="h-4 w-20 bg-surface-3 rounded" />
                  <div className="h-4 w-14 bg-surface-3 rounded" />
                  <div className="h-4 w-14 bg-surface-3 rounded" />
                  <div className="h-4 w-12 bg-surface-3 rounded" />
                  <div className="h-4 w-14 bg-surface-3 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card p-4 space-y-4">
            <div className="h-5 w-32 bg-surface-3 rounded" />
            <div className="h-12 w-full bg-surface-3 rounded" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-surface-3 rounded" />
                  <div className="h-3 w-8 bg-surface-3 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glow-line opacity-30" />

      {/* AI Analysis skeleton */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 bg-surface-3 rounded" />
          <div className="h-8 w-32 bg-surface-3 rounded-lg" />
        </div>
        <div className="h-4 w-full bg-surface-3 rounded" />
        <div className="h-4 w-5/6 bg-surface-3 rounded" />
        <div className="h-4 w-3/4 bg-surface-3 rounded" />
      </div>
    </div>
  )
}
