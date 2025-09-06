import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Users, ChevronDown, ChevronUp } from "lucide-react";

type Job = {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  status: "open" | "closed";
};

type Application = {
  _id: string;
  candidateId: { fullName: string; email: string }; // ✅ fix typing
  status:
    | "applied"
    | "in-progress"
    | "selected"
    | "final-selected"
    | "rejected";
  createdAt: string;
};

const statusLabels: Record<Application["status"], string> = {
  applied: "Applied",
  "in-progress": "In-Progress",
  selected: "Selected",
  "final-selected": "Final-Selected",
  rejected: "Rejected",
};

const statusColors: Record<Application["status"], string> = {
  applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "in-progress":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  selected: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "final-selected":
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const CompanyJobApplicationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

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
          axiosInstance.get(`/applications/job/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ]);
        setJob(jobRes.data);
        setApplications(appsRes.data || []);
        console.log(appsRes.data);
      } catch (err) {
        console.error("Error fetching job or applications", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!job) return <div className="p-6">Job not found</div>;

  // Group applications by status
  // Normalize status from backend to match our keys
  const normalizeStatus = (status: string): Application["status"] => {
    if (status === "in-process") return "in-progress"; // just in case
    return status as Application["status"];
  };

  // Initialize groups
  const groupedApps: Record<Application["status"], Application[]> = {
    applied: [],
    "in-progress": [],
    selected: [],
    "final-selected": [],
    rejected: [],
  };

  // Fill groups safely
  applications.forEach((app) => {
    const normalized = normalizeStatus(app.status);
    if (groupedApps[normalized]) {
      groupedApps[normalized].push(app);
    } else {
      console.warn("Unexpected status:", app.status);
    }
  });

  const toggleGroup = (status: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  return (
    <>
      <Navigation />
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
        {/* Job Header */}
        <Card className="rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {job.title}
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge
                className={
                  job.status === "open"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }
              >
                {job.status === "open" ? "Open" : "Closed"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">
              {job.description}
            </p>
          </CardContent>
        </Card>

        {/* Applications by status */}
        {Object.entries(groupedApps).map(([status, apps]) => (
          <Card
            key={status}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <CardHeader
              onClick={() => toggleGroup(status)}
              className="cursor-pointer flex flex-row justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {statusLabels[status as Application["status"]]} ({apps.length}
                  )
                </CardTitle>
              </div>
              {expandedGroups[status] ? (
                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </CardHeader>
            {expandedGroups[status] && (
              <CardContent className="space-y-4">
                {apps.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No applications yet.
                  </p>
                ) : (
                  apps.map((app) => (
                    <div
                      key={app._id}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#23263A] hover:shadow-md transition cursor-pointer"
                      onClick={() =>
                        navigate(`/company/job/${job._id}/${app._id}`)
                      }
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {app.candidateId.fullName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {app.candidateId.email}
                          </p>
                        </div>
                        <Badge className={statusColors[app.status]}>
                          {statusLabels[app.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Applied on:{" "}
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </>
  );
};

export default CompanyJobApplicationsPage;
