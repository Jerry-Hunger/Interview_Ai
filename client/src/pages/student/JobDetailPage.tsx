import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { Calendar, Layers } from "lucide-react";

type Round = {
  roundNumber?: number;
  type?: string;
  difficulty?: string;
  topic?: string;
  duration?: number;
  notes?: string;
};

type JobType = {
  _id: string;
  title: string;
  description: string;
  skills: string[];
  rounds: Round[];
  difficulty: string;
  status: string;
  createdAt: string;
};

type ApplicationType = {
  _id: string;
  jobId: { _id: string } | string;
};

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobType | null>(null);
  const [applications, setApplications] = useState<ApplicationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobRes, appsRes] = await Promise.all([
          axiosInstance.get(`/jobs/${id}`, {
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
        setJob(jobRes.data);
        setApplications(appsRes.data || []);
      } catch (err) {
        console.error("Error fetching job detail", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const hasApplied = applications.some((a) => {
    const jobId = a.jobId;
    const jid = typeof jobId === "object" && jobId !== null ? jobId._id : jobId;
    return jid?.toString() === id?.toString();
  });

  const handleApply = async () => {
    if (hasApplied) {
      alert("您已申请过该职位。");
      return;
    }
    setApplying(true);
    try {
      await axiosInstance.post(
        "/applications",
        { jobId: id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const appsRes = await axiosInstance.get("/applications/mine");
      setApplications(appsRes.data || []);
      alert("申请成功！");
    } catch (err: unknown) {
      console.error("Apply failed", err);
      const axiosError = err as { response?: { data?: { msg?: string } } };
      alert(axiosError.response?.data?.msg ?? "申请失败");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-600 dark:text-gray-300">加载中...</div>;
  if (!job) return <div className="p-6 text-gray-600 dark:text-gray-300">职位不存在</div>;

  return (
    <>
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                  {job.title}
                </CardTitle>
                <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={job.status === "closed" ? "destructive" : "default"}
                >
                  {job.status === "closed" ? "已结束" : "招聘中"}
                </Badge>
                {job.difficulty && <Badge className="dark:bg-gray-700 dark:text-gray-200">{job.difficulty}</Badge>}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                职位描述
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {job.description}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                技能要求
              </h3>
              <div className="flex flex-wrap gap-2">
                {(job.skills || []).map((s: string) => (
                  <Badge key={s} className="text-sm dark:bg-gray-700 dark:text-gray-200">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                面试环节
              </h3>
              <div className="space-y-3">
                {(job.rounds || []).map((r: Round, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg bg-gray-50 dark:bg-[#23263A] border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {r.type ?? `第 ${idx + 1} 轮`}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {r.topic}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                        <div>难度：{r.difficulty === "easy" ? "简单" : r.difficulty === "medium" ? "中等" : r.difficulty === "hard" ? "困难" : r.difficulty}</div>
                        <div>时长：{r.duration ?? "-"} 分钟</div>
                      </div>
                    </div>
                    {r.notes && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        {r.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => navigate(-1)} variant="outline">
                返回
              </Button>
              {job.status !== "closed" && (
                <Button onClick={handleApply} disabled={applying || hasApplied}>
                  {hasApplied
                    ? "已申请"
                    : applying
                    ? "申请中..."
                    : "申请职位"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default JobDetailPage;
