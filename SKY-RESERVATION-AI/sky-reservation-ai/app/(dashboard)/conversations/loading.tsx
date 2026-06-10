import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationsLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left panel — conversation list */}
      <div className="w-80 shrink-0 border-r border-white/10 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
        {/* List items */}
        <div className="flex-1 overflow-hidden divide-y divide-white/5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4 flex items-start gap-3">
              <div className="relative shrink-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-transparent" />
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — empty state skeleton */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-5 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    </div>
  );
}
