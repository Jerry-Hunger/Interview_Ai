import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { Briefcase, ChevronDown, ChevronUp } from "lucide-react";

type Application = {
  _id: string;
  jobId: { _id: string; title: string };
  status:
    | "applied"
    | "in-progress"
    | "selected"
    | "final-selected"
    | "rejected";
  createdAt: string;
  currentRound?: number;
};

const statusLabels: Record<Application["status"], string> = {
  applied: "Applied",
  "in-progress": "In Progress",
  selected: "Selected",
  "final-selected": "Final Selected",
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

const StudentApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/applications/mine", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setApplications(res.data || []);
      } catch (err) {
        console.error("Error fetching applications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  // Group by status
  const groupedApps: Record<Application["status"], Application[]> = {
    applied: [],
    "in-progress": [],
    selected: [],
    "final-selected": [],
    rejected: [],
  };
  applications.forEach((app) => {
    if (groupedApps[app.status]) {
      groupedApps[app.status].push(app);
    }
  });

  const toggleGroup = (status: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  if (loading) return <div className="p-6">Loading applications...</div>;

  return (
    <>
      <Navigation />
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2 mb-6">
          <Briefcase className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          My Applications
        </h2>

        {Object.entries(groupedApps).map(([status, apps]) => (
          <Card
            key={status}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <CardHeader
              onClick={() => toggleGroup(status)}
              className="cursor-pointer flex flex-row justify-between items-center"
            >
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {statusLabels[status as Application["status"]]} ({apps.length})
              </CardTitle>
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
                    No applications in this category.
                  </p>
                ) : (
                  apps.map((app) => (
                    <div
                      key={app._id}
                      onClick={() =>
                        navigate(`/student/application/${app._id}`)
                      }
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#23263A] hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {app.jobId?.title}
                        </p>
                        <Badge className={statusColors[app.status]}>
                          {statusLabels[app.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Applied on:{" "}
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                      {app.currentRound !== undefined && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Current Round: {app.currentRound}
                        </p>
                      )}
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

export default StudentApplicationsPage;
