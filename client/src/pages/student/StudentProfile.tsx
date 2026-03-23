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
        console.error("获取用户信息失败:", err);
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
      console.error("保存简历失败:", err);
      alert("保存简历失败，请稍后重试。");
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-300">
        加载中...
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
              <User size={20} /> 个人资料
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">姓名：</span> {user.fullName}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">邮箱：</span> {user.email}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">角色：</span> {user.role === "student" ? "学生" : "企业"}
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-400">
                简历
              </h3>

              {user.resumeText ? (
                <div className="bg-gray-50 dark:bg-[#23263A] p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={18} className="text-indigo-500" />
                    <span className="font-medium">已保存的简历</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line mb-3">
                    {user.resumeText.slice(0, 200)}...
                  </p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="cursor-pointer mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    预览简历
                  </button>

                  {showModal && (
                    <ResumeViewer
                      resumeText={user.resumeText}
                      onClose={() => setShowModal(false)}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  尚未上传简历
                </p>
              )}

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
