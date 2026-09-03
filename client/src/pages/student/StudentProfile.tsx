import { lazy, Suspense, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Phone, MapPin, DollarSign, GraduationCap, Code, User } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ResumeViewer from "@/components/resume/ResumeViewer";
import SimpleAvatarUploader from "@/components/ui/SimpleAvatarUploader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { archiveResume, fetchMyResumes, fetchStudentProfile, setDefaultResume, updateResumeTitle } from "@/services/api";
import { useFetch } from "@/hooks/useFetch";
import type { ResumeSummary } from "@/types";

// 个人资料页不预加载本地 PDF、DOCX 与 OCR 解析功能。
const ResumeUploader = lazy(() => import("@/components/practice/ResumeUploader"));

type UserType = {
  avatarUrl?: string;
  fullName: string;
  email: string;
  role: string;
  defaultResumeId?: string;
  /** 兼容迁移前的资料字段。 */
  resumeId?: string;
  phone?: string;
  location?: string;
  expectedSalaryMin?: string;
  expectedSalaryMax?: string;
  education?: string;
  skills?: string[];
};

const ProfilePage = () => {
  const { data: user, loading: isPending } = useFetch(() => fetchStudentProfile());
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const { data: resumes, refetch: refetchResumes } = useFetch(() => fetchMyResumes());

  useEffect(() => {
    if (user) {
      setCurrentUser(user as UserType);
    }
  }, [user]);

  const handleAvatarUploadSuccess = (url: string) => {
    setCurrentUser((prev: UserType | null) => (prev ? { ...prev, avatarUrl: url } : null));
  };

  const handleResumeUploadSuccess = (data: { resumeId: string; fileUrl: string; fileName: string }) => {
    console.log("简历上传成功:", data);
    if (data.resumeId) {
      setCurrentUser((prev) => (prev && !prev.defaultResumeId && !prev.resumeId
        ? { ...prev, defaultResumeId: data.resumeId }
        : prev));
      void refetchResumes();
    }
  };

  const handleResumeTextSave = async (data: { resumeText: string; resumeId?: string; fileUrl?: string; fileName?: string }) => {
    if (data.resumeId && data.resumeText) {
      try {
        await axiosInstance.put(
          `/resume/${data.resumeId}/text`,
          { text: data.resumeText }
        );
      } catch (err) {
        console.error("保存简历文本失败:", err);
      }
    }
  };

  const handleSetDefaultResume = async (resumeId: string) => {
    try {
      await setDefaultResume(resumeId);
      setCurrentUser((prev) => (prev ? { ...prev, defaultResumeId: resumeId, resumeId: undefined } : prev));
      await refetchResumes();
      toast({ title: "已设为默认简历" });
    } catch {
      toast({ title: "设置默认简历失败", variant: "destructive" });
    }
  };

  const handleArchiveResume = async (resumeId: string) => {
    try {
      await archiveResume(resumeId);
      setCurrentUser((prev) => prev?.defaultResumeId === resumeId
        ? { ...prev, defaultResumeId: undefined }
        : prev);
      await refetchResumes();
      toast({ title: "简历已归档", description: "历史投递和面试记录不受影响" });
    } catch {
      toast({ title: "归档简历失败", variant: "destructive" });
    }
  };

  const handleRenameResume = async (resume: ResumeSummary) => {
    const title = window.prompt("输入简历名称", resume.title)?.trim();
    if (!title || title === resume.title) return;
    try {
      await updateResumeTitle(resume._id, title);
      await refetchResumes();
      toast({ title: "简历名称已更新" });
    } catch {
      toast({ title: "更新简历名称失败", variant: "destructive" });
    }
  };

  const startEdit = () => {
    if (!currentUser) return;
    setEditValues({
      fullName: currentUser.fullName || "",
      phone: currentUser.phone || "",
      location: currentUser.location || "",
      expectedSalaryMin: currentUser.expectedSalaryMin || "",
      expectedSalaryMax: currentUser.expectedSalaryMax || "",
      education: currentUser.education || "",
      skills: currentUser.skills?.join(", ") || "",
    });
    setIsEditing(true);
  };

  const saveAllChanges = async () => {
    if (!currentUser) return;

    const updates: Record<string, string | string[] | number> = {};
    if (editValues.fullName !== currentUser.fullName) {
      updates.fullName = editValues.fullName;
    }
    if (editValues.phone !== (currentUser.phone || "")) {
      updates.phone = editValues.phone;
    }
    if (editValues.location !== (currentUser.location || "")) {
      updates.location = editValues.location;
    }
    if (editValues.expectedSalaryMin !== (currentUser.expectedSalaryMin?.toString() || "")) {
      updates.expectedSalaryMin = editValues.expectedSalaryMin || '0';
    }
    if (editValues.expectedSalaryMax !== (currentUser.expectedSalaryMax?.toString() || "")) {
      updates.expectedSalaryMax = editValues.expectedSalaryMax || '0';
    }
    if (editValues.education !== (currentUser.education || "")) {
      updates.education = editValues.education;
    }
    if (editValues.skills !== (currentUser.skills?.join(", ") || "")) {
      updates.skills = editValues.skills.split(",").map((s) => s.trim()).filter(Boolean);
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await axiosInstance.put("/auth/profile", updates);
      setCurrentUser(res.data.user);
      setIsEditing(false);
      toast({ title: "保存成功" });
    } catch (err) {
      console.error("保存失败:", err);
      toast({ title: "保存失败", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValues({});
  };

  const handleEditValueChange = (field: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const renderField = (field: string, label: string, value: string | undefined, icon: React.ReactNode) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        {icon}
        <span className="font-medium">{label}：</span>
        {isEditing ? (
          <Input
            value={editValues[field] || ""}
            onChange={(e) => handleEditValueChange(field, e.target.value)}
            className="w-48 h-8 ml-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800"
          />
        ) : (
          <span>{value || "未设置"}</span>
        )}
      </div>
    </div>
  );

  if (isPending || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A] flex items-center justify-center">
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="shadow-lg rounded-2xl bg-white dark:bg-[#181A2A]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl font-bold text-indigo-700 dark:text-indigo-300">
              <div className="flex items-center gap-2">
                <User size={20} /> 个人资料
              </div>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEdit}
                  className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-950"
                >
                  编辑
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveAllChanges}
                    disabled={saving}
                    className="border-green-500 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950"
                  >
                    {saving ? "保存中..." : "确认"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEdit}
                    disabled={saving}
                    className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    取消
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-6">
              <SimpleAvatarUploader
                avatarUrl={currentUser.avatarUrl}
                userName={currentUser.fullName}
                size="xl"
                onUploadSuccess={handleAvatarUploadSuccess}
              />
              <div className="flex-1 space-y-1">
                <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2 py-2">
                  <span className="font-medium">姓名：</span> {currentUser.fullName}
                </p>
                <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2 py-2">
                  <span className="font-medium">邮箱：</span> {currentUser.email}
                </p>
                <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2 py-2">
                  <span className="font-medium">角色：</span> {currentUser.role === "student" ? "学生" : "企业"}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-1">
              {renderField("phone", "手机号", currentUser.phone, <Phone size={16} />)}
              {renderField("location", "所在地", currentUser.location, <MapPin size={16} />)}
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 py-2">
                <DollarSign size={16} />
                <span className="font-medium">期望薪资：</span>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editValues.expectedSalaryMin || ""}
                      onChange={(e) => handleEditValueChange("expectedSalaryMin", e.target.value)}
                      placeholder="最低"
                      className="w-24 h-8 border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                    />
                    <span className="text-gray-600 dark:text-gray-300">-</span>
                    <Input
                      value={editValues.expectedSalaryMax || ""}
                      onChange={(e) => handleEditValueChange("expectedSalaryMax", e.target.value)}
                      placeholder="最高"
                      className="w-24 h-8 border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                    />
                  </div>
                ) : (
                  <span>
                    {currentUser.expectedSalaryMin || currentUser.expectedSalaryMax
                      ? `${currentUser.expectedSalaryMin || ""}${currentUser.expectedSalaryMin && currentUser.expectedSalaryMax ? " - " : ""}${currentUser.expectedSalaryMax || ""}`
                      : "未设置"}
                  </span>
                )}
              </div>
              {renderField("education", "学历", currentUser.education, <GraduationCap size={16} />)}
              {renderField("skills", "技能", currentUser.skills?.join(", "), <Code size={16} />)}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-400">
                简历
              </h3>

              {(resumes || []).length > 0 ? (
                <div className="space-y-2">
                  {((resumes || []) as ResumeSummary[]).map((resume) => (
                    <div key={resume._id} className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-[#23263A] p-3 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={18} className="shrink-0 text-indigo-500 dark:text-indigo-400" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-700 dark:text-gray-300 truncate">{resume.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{resume.fileName} · {resume.fileType.toUpperCase()}</p>
                        </div>
                        {resume.isDefault && <span className="text-xs rounded-full bg-indigo-100 px-2 py-1 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">默认</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPreviewResumeId(resume._id)}>预览</Button>
                        <Button size="sm" variant="outline" onClick={() => handleRenameResume(resume)}>重命名</Button>
                        {!resume.isDefault && <Button size="sm" variant="outline" onClick={() => handleSetDefaultResume(resume._id)}>设为默认</Button>}
                        <Button size="sm" variant="outline" onClick={() => handleArchiveResume(resume._id)}>归档</Button>
                      </div>
                    </div>
                  ))}
                  {previewResumeId && <ResumeViewer resumeId={previewResumeId} onClose={() => setPreviewResumeId(null)} />}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  尚未上传简历
                </p>
              )}

              <div className="mt-4">
                <Suspense fallback={<p className="text-sm text-gray-500">正在加载简历上传功能...</p>}>
                  <ResumeUploader
                    handleDataChanged={handleResumeTextSave}
                    onUploadSuccess={handleResumeUploadSuccess}
                  />
                </Suspense>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
