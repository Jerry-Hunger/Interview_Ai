// src/pages/JobDetailPage.tsx
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

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
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
    const jid =
      typeof a.jobId === "object" && a.jobId !== null
        ? (a.jobId as any)._id
        : a.jobId;
    return jid?.toString() === id?.toString();
  });

  const handleApply = async () => {
    if (hasApplied) {
      alert("You have already applied for this job.");
      return;
    }
    setApplying(true);
    try {
      await axiosInstance.post("/applications", { jobId: id });
      const appsRes = await axiosInstance.get("/applications/mine");
      setApplications(appsRes.data || []);
      alert("Applied successfully!");
    } catch (err: any) {
      console.error("Apply failed", err);
      alert(err?.response?.data?.msg ?? "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!job) return <div className="p-6">Job not found</div>;

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
                  {job.status === "closed" ? "Closed" : "Open"}
                </Badge>
                {job.difficulty && <Badge>{job.difficulty}</Badge>}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Job Description */}
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                Description
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* Skills */}
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                Skills Required
              </h3>
              <div className="flex flex-wrap gap-2">
                {(job.skills || []).map((s: string) => (
                  <Badge key={s} className="text-sm">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Interview Rounds */}
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Interview Rounds
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
                          {r.type ?? `Round ${idx + 1}`}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {r.topic}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                        <div>Difficulty: {r.difficulty}</div>
                        <div>Duration: {r.duration ?? "-"} mins</div>
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={() => navigate(-1)} variant="outline">
                Back
              </Button>
              {job.status !== "closed" && (
                <Button onClick={handleApply} disabled={applying || hasApplied}>
                  {hasApplied
                    ? "Already Applied"
                    : applying
                    ? "Applying..."
                    : "Apply"}
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
