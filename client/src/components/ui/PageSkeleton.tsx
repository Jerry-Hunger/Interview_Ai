import { Skeleton } from "@/components/ui/skeleton";

interface PageSkeletonProps {
  variant?: "dashboard" | "detail" | "table" | "form";
  className?: string;
}

const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DetailSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
    <Skeleton className="h-10 w-full rounded-lg" />
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-4">
        <Skeleton className="h-5 w-5/12" />
        <Skeleton className="h-5 w-3/12" />
        <Skeleton className="h-5 w-2/12" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

const FormSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
    <Skeleton className="h-8 w-40" />
    <div className="rounded-2xl p-6 space-y-5">
      <div className="flex items-start gap-5">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  </div>
);

const variants = {
  dashboard: DashboardSkeleton,
  detail: DetailSkeleton,
  table: TableSkeleton,
  form: FormSkeleton,
};

const PageSkeleton = ({ variant = "dashboard", className }: PageSkeletonProps) => {
  const Component = variants[variant];
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-[#0f172a] ${className ?? ""}`}>
      <Component />
    </div>
  );
};

export { PageSkeleton };
