import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      {/* Main trend chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-lg" />
            ))}
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>

      {/* Secondary charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel distribution */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-6">
            <Skeleton className="h-36 w-36 rounded-full" />
            <div className="flex-1 space-y-3 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Top services */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-28 shrink-0" />
                <Skeleton className="h-5 flex-1 rounded-md" style={{ maxWidth: `${85 - i * 12}%` }} />
                <Skeleton className="h-3 w-6 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap skeleton */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 7 * 17 }).map((_, i) => (
            <Skeleton key={i} className="h-7 rounded-md" />
          ))}
        </div>
      </div>

      {/* Top customers table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <Skeleton className="h-5 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
