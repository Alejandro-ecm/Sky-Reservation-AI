import { Skeleton } from "@/components/ui/skeleton";

export default function CrmLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Search & filters */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Customer table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-white/10">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 px-5 py-4 border-b border-white/5 items-center">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-8" />
            </div>
            <div className="flex gap-2 justify-end">
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
