import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import ResumeViewer from "@/components/resume/ResumeViewer";
// import PracticeResult from "@/components/practice/PracticeResults";

type Application = {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    rounds: { roundNumber: number; type: string }[];
  };
  candidateId: {
    _id: string;
    name: string;
    email: string;
  };
  resumeText: string;
  currentRound: number;
  status:
    | "applied"
    | "in-progress"
    | "selected"
    | "final-selected"
    | "rejected";
  history: {
    roundNumber: number;
    interviewId?: string;
    result: string;
    feedback: string;
  }[];
};

const ApplicationDetailPage: React.FC = () => {
  const { jobId, applicationId } = useParams<{
    jobId: string;
    applicationId: string;
  }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResume, setShowResume] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchApp = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/applications/${applicationId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setApplication(res.data);
      } catch (err) {
        console.error("Error fetching application", err);
      } finally {
        setLoading(false);
      }
    };
    if (applicationId) fetchApp();
  }, [applicationId]);

  const updateStatus = async (newStatus: string) => {
    if (!application) return;
    setUpdating(true);
    try {
      await axiosInstance.patch(
        `/applications/${application._id}`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setApplication({ ...application, status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!application) return <div className="p-6">Application not found</div>;

  const completedRounds = application.history?.length || 0;
  const totalRounds = application.jobId.rounds?.length || 0;

  return (
    <>
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">
                {application.candidateId?.name} - {application.jobId?.title}
              </CardTitle>
              <Badge
                variant={
                  application.status === "final-selected"
                    ? "success"
                    : application.status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
              >
                {application.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Email: {application.candidateId?.email}
            </p>

            <div className="flex gap-2">
              <Button onClick={() => setShowResume(true)} variant="outline">
                View Resume
              </Button>
            </div>

            {/* Round Progress */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Interview Progress</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {completedRounds} / {totalRounds} rounds completed
              </p>
              <div className="mt-3 space-y-2">
                {application.history?.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-gray-50 dark:bg-[#23263A]"
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">
                        Round {h.roundNumber}
                      </span>
                      <span className="text-xs text-gray-500">{h.result}</span>
                    </div>
                    {h.feedback && (
                      <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                        {h.feedback}
                      </p>
                    )}
                    {/* {h.interviewId && (
                      <PracticeResult interview={h.interviewId} />
                    )} */}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button onClick={() => navigate(-1)} variant="outline">
                Back
              </Button>

              {application.status === "applied" && (
                <>
                  <Button
                    onClick={() => updateStatus("in-progress")}
                    disabled={updating}
                  >
                    Approve → In Progress
                  </Button>
                  <Button
                    onClick={() => updateStatus("rejected")}
                    variant="destructive"
                    disabled={updating}
                  >
                    Reject
                  </Button>
                </>
              )}

              {application.status === "selected" && (
                <Button
                  onClick={() => updateStatus("final-selected")}
                  disabled={updating}
                >
                  Approve → Final Selected
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showResume && (
        <ResumeViewer
          resumeText={application.resumeText}
          onClose={() => setShowResume(false)}
        />
      )}
    </>
  );
};

export default ApplicationDetailPage;
