export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-28" />
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 h-64" />
      {/* Table skeleton */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <div className="h-4 bg-white/10 rounded w-1/4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-white/5 rounded" />
        ))}
      </div>
    </div>
  );
}
