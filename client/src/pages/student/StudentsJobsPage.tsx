import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

type Job = {
  _id: string;
  title: string;
  description?: string;
  skills?: string[];
  rounds?: any[];
  difficulty?: string;
  createdAt?: string;
  status?: "open" | "closed";
};

type Application = {
  _id: string;
  jobId: Job | string;
  status: string;
  currentRound?: string;
  createdAt?: string;
};

const StudentJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobsRes, appsRes] = await Promise.all([
          axiosInstance.get("/jobs", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          axiosInstance.get("/applications/mine", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ]);
        setJobs(jobsRes.data || []);
        setApplications(appsRes.data || []);
      } catch (err) {
        console.error("Error fetching jobs/apps", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const appliedJobIds = new Set(
    applications.map((a) => {
      const id = (a.jobId as any)?._id ?? (a.jobId as any) ?? "";
      return String(id);
    })
  );

  const openJobs = jobs.filter(
    (job) => job.status === "open" && !appliedJobIds.has(String(job._id))
  );
  const closedJobs = jobs.filter((job) => job.status === "closed");
  const appliedJobs = jobs.filter((job) => appliedJobIds.has(String(job._id)));

  const applyJob = async (jobId: string) => {
    setApplyingId(jobId);
    try {
      await axiosInstance.post(
        "/applications",
        { jobId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const appsRes = await axiosInstance.get("/applications/mine", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setApplications(appsRes.data || []);
    } catch (err: any) {
      console.error("Apply failed", err);
      const msg =
        err?.response?.data?.msg ?? "申请失败，请重试。";
      alert(msg);
    } finally {
      setApplyingId(null);
    }
  };

  const renderJobs = (
    list: Job[],
    label: string,
    type: "open" | "closed" | "applied"
  ) => {
    if (list.length === 0) {
      return (
        <p className="text-gray-600 dark:text-gray-400 italic mb-8">
          暂无{label}职位。
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {list.map((job) => {
          const alreadyApplied = appliedJobIds.has(String(job._id));

          return (
            <Card
              key={job._id}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all bg-white dark:bg-gray-900"
            >
              <CardHeader className="flex flex-col gap-2">
                <CardTitle
                  className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:underline"
                  onClick={() => navigate(`/student/jobs/${job._id}`)}
                >
                  {job.title}
                </CardTitle>
                <Badge
                  variant={
                    type === "open"
                      ? "default"
                      : type === "applied"
                      ? "secondary"
                      : "destructive"
                  }
                  className="w-fit"
                >
                  {type === "open" ? "招聘中" : type === "applied" ? "已申请" : "已结束"}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {job.description}
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  技能要求：{(job.skills || []).join(", ")}
                </p>
                <div className="mt-4 flex gap-2">
                  {type === "open" && (
                    <Button
                      onClick={() => applyJob(job._id)}
                      disabled={applyingId === job._id || alreadyApplied}
                      className="flex-1"
                    >
                      {alreadyApplied
                        ? "已申请"
                        : applyingId === job._id
                        ? "申请中..."
                        : "立即申请"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/student/jobs/${job._id}`)}
                  >
                    查看详情
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Navigation />
      <div className="max-w-6xl mx-auto py-10 px-4">
        <h2 className="text-3xl font-bold mb-10 flex items-center gap-3 text-gray-900 dark:text-white">
          <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          职位列表
        </h2>

        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">加载中...</p>
        ) : (
          <>
            <h3 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
              招聘中的职位
            </h3>
            {renderJobs(openJobs, "招聘中", "open")}

            <h3 className="text-2xl font-semibold mb-4 text-green-600 dark:text-green-400">
              已申请的职位
            </h3>
            {renderJobs(appliedJobs, "已申请", "applied")}

            <h3 className="text-2xl font-semibold mb-4 text-red-600 dark:text-red-400">
              已结束的职位
            </h3>
            {renderJobs(closedJobs, "已结束", "closed")}
          </>
        )}
      </div>
    </>
  );
};

export default StudentJobsPage;
