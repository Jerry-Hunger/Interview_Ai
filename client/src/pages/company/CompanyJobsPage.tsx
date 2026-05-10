import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Briefcase, Calendar, Power, PowerOff } from "lucide-react";
import { fetchCompanyJobs, updateJobStatus as updateJobStatusApi, type Job } from "@/services/api";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/hooks/use-toast";

const CompanyJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: jobs, loading: isPending, error, refetch } = useFetch(() => fetchCompanyJobs());

  const handleToggleStatus = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    const newStatus = job.status === "open" ? "closed" : "open";
    try {
      await updateJobStatusApi({ jobId: job._id, status: newStatus });
      toast({
        title: "更新成功",
        description: `职位已${newStatus === "open" ? "开启" : "关闭"}`,
      });
      refetch();
    } catch {
      toast({
        title: "更新失败",
        description: "职位状态更新失败，请重试",
        variant: "destructive",
      });
    }
  };

  if (isPending) return (
    <div className="min-h-screen bg-white dark:bg-[#101322] flex items-center justify-center">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  );
  if (error) return <div className="p-6 text-red-500">获取职位列表失败</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <Briefcase className="w-7 h-7 text-gray-900 dark:text-gray-300" />
          我的发布职位
        </h1>

        {(jobs ?? []).length === 0 ? (
          <div className="text-gray-600 dark:text-gray-400">
            您还没有发布任何职位
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(jobs ?? []).map((job) => (
              <Card
                key={job._id}
                className="rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/company/job/${job._id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {job.title}
                  </CardTitle>
                  <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "未知"}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {(job.skills || []).slice(0, 3).map((s) => (
                      <Badge key={s} className="text-xs dark:bg-gray-700 dark:text-gray-200">
                        {s}
                      </Badge>
                    ))}
                    {job.skills && job.skills.length > 3 && (
                      <Badge className="text-xs dark:bg-gray-700 dark:text-gray-200">
                        +{job.skills.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <Badge
                      className={job.status === "closed" ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200" : ""}
                    >
                      {job.status === "closed" ? "已结束" : "招聘中"}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {job.difficulty && (
                        <Badge className="text-xs dark:bg-gray-700 dark:text-gray-200">{job.difficulty}</Badge>
                      )}
                      <button
                        onClick={(e) => handleToggleStatus(e, job)}
                        className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                          job.status === "open"
                            ? "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                        }`}
                        title={job.status === "open" ? "关闭职位" : "开启职位"}
                      >
                        {job.status === "open" ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Button
            onClick={() => navigate("/company/job/new")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
          >
            发布新职位
          </Button>
        </div>
      </div>
  );
};

export default CompanyJobsPage;
