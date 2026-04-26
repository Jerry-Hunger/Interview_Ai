import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  );
};

export { PageSkeleton };
