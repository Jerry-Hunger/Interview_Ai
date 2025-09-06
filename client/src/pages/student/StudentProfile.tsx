import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, FileText } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import Navigation from "@/components/Navigation";
import ResumeUploader from "@/components/practice/ResumeUploader";
import ResumeViewer from "@/components/resume/ResumeViewer";

const ProfilePage = () => {
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUser(res.data.user);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleResumeTextSave = async (resumeText: string) => {
    try {
      const res = await axiosInstance.post(
        "/resume/update-text",
        {
          resumeText: resumeText,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to save resume text:", err);
      alert("Failed to save resume.");
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-300">
        Loading profile...
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="shadow-lg rounded-2xl bg-white dark:bg-[#181A2A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-indigo-700 dark:text-indigo-300">
              <User size={20} /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Name:</span> {user.fullName}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Email:</span> {user.email}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Role:</span> {user.role}
              </p>
            </div>

            {/* Resume Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-400">
                Resume
              </h3>

              {user.resumeText ? (
                <div className="bg-gray-50 dark:bg-[#23263A] p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={18} className="text-indigo-500" />
                    <span className="font-medium">Stored Resume</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line mb-3">
                    {user.resumeText.slice(0, 200)}...
                  </p>
                  {/* Example button to open the modal */}
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Preview Resume
                  </button>

                  {/* Conditionally render modal */}
                  {showModal && (
                    <ResumeViewer
                      resumeText={user.resumeText}
                      onClose={() => setShowModal(false)} // ✅ onClose body
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No resume uploaded yet.
                </p>
              )}

              {/* Resume Upload (PDF Parsing) */}
              <div className="mt-4">
                <ResumeUploader dataChanged={handleResumeTextSave} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ProfilePage;
