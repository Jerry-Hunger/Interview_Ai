import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Briefcase, Calendar } from "lucide-react";

type Job = {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  status: "open" | "closed";
  difficulty?: string;
  skills?: string[];
};

const CompanyJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/jobs/company", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setJobs(res.data || []);
      } catch (err) {
        console.error("获取职位列表失败", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (loading) return <div className="p-6 text-gray-600 dark:text-gray-300">加载中...</div>;

  return (
    <>
      <Navigation />
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <Briefcase className="w-7 h-7 text-gray-900 dark:text-gray-300" />
          我的发布职位
        </h1>

        {jobs.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-400">
            您还没有发布任何职位
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
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
                    {new Date(job.createdAt).toLocaleDateString()}
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
                      variant={
                        job.status === "closed" ? "destructive" : "default"
                      }
                    >
                      {job.status === "closed" ? "已结束" : "招聘中"}
                    </Badge>
                    {job.difficulty && (
                      <Badge className="text-xs dark:bg-gray-700 dark:text-gray-200">{job.difficulty}</Badge>
                    )}
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
    </>
  );
};

export default CompanyJobsPage;
