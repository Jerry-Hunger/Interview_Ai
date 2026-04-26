import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f172a]">
    <LoadingSpinner size="lg" text="加载中..." />
  </div>
);

export default LoadingFallback;
