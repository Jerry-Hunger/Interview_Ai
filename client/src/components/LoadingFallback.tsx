import { Skeleton } from "@/components/ui/skeleton";

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f172a]">
    <div className="w-full max-w-3xl px-6 space-y-6">
      <Skeleton className="h-8 w-44 mx-auto" />
      <Skeleton className="h-4 w-64 mx-auto" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  </div>
);

export default LoadingFallback;
