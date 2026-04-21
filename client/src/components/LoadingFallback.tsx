import { PageSkeleton } from "@/components/ui/PageSkeleton";

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <PageSkeleton variant="dashboard" className="w-full" />
  </div>
);

export default LoadingFallback;
