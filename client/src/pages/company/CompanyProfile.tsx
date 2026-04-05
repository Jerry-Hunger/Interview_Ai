import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building, Upload, Trash2, X, Eye } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AvatarUploader from "@/components/ui/AvatarUploader";

type CompanyUser = {
  companyName?: string;
  companyLogoUrl?: string;
  companyPhotos?: string[];
  companyDescription?: string;
  companyLocation?: string;
  companyLocationCoords?: { lat: number; lng: number };
  companyWebsite?: string;
  email?: string;
};

const CompanyProfilePage = () => {
  const [company, setCompany] = useState<CompanyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const { toast } = useToast();

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get("/company/profile", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCompany(res.data);
    } catch (err) {
      console.error("获取企业信息失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotosUpload = async (files: FileList) => {
    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
      const res = await axiosInstance.post("/upload/photos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.data.success) {
        const newPhotos = [...(company?.companyPhotos || []), ...res.data.urls].slice(0, 10);
        setCompany((prev) => prev ? { ...prev, companyPhotos: newPhotos } : null);
        toast({ title: "照片上传成功" });
      }
    } catch (err) {
      console.error("上传失败:", err);
      toast({ title: "上传失败", variant: "destructive" });
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleDeletePhoto = async (url: string) => {
    try {
      await axiosInstance.delete("/company/photos", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        data: { url },
      });
      setCompany((prev) => prev ? {
        ...prev,
        companyPhotos: (prev.companyPhotos || []).filter(p => p !== url)
      } : null);
      toast({ title: "照片已删除" });
    } catch (err) {
      console.error("删除失败:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.put("/company/profile", company, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast({ title: "保存成功" });
    } catch (err) {
      console.error("保存失败:", err);
      toast({ title: "保存失败", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof CompanyUser, value: string | string[]) => {
    setCompany((prev) => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-300">
        加载中...
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card className="shadow-lg rounded-2xl bg-white dark:bg-[#181A2A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-purple-700 dark:text-purple-300">
              <Building size={20} /> 公司资料
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">公司 Logo</Label>
              <div className="flex items-center gap-4">
                <AvatarUploader
                  avatarUrl={company?.companyLogoUrl}
                  userName={company?.companyName || "Logo"}
                  size="lg"
                  dialogTitle="裁剪 Logo"
                  uploadEndpoint="/upload/logo"
                  onUploadSuccess={(url) => {
                    setCompany((prev) => prev ? { ...prev, companyLogoUrl: url } : null);
                    toast({ title: "Logo 上传成功" });
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">公司名称</Label>
              <Input
                id="companyName"
                value={company?.companyName || ""}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="请输入公司名称"
                className="placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={company?.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="用于接收候选人发送的面试邀请"
                className="placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyDescription">公司简介</Label>
              <Textarea
                id="companyDescription"
                value={company?.companyDescription || ""}
                onChange={(e) => updateField("companyDescription", e.target.value)}
                placeholder="请输入公司简介"
                rows={4}
                className="placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyLocation">办公地点</Label>
                <Input
                  id="companyLocation"
                  value={company?.companyLocation || ""}
                  onChange={(e) => updateField("companyLocation", e.target.value)}
                  placeholder="例如：北京市朝阳区"
                  className="placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">公司官网</Label>
                <Input
                  id="companyWebsite"
                  value={company?.companyWebsite || ""}
                  onChange={(e) => updateField("companyWebsite", e.target.value)}
                  placeholder="https://example.com"
                  className="placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">公司环境照片</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(company?.companyPhotos || []).map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`环境照片 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer"
                      onClick={() => setPreviewPhoto(photo)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-gray-800"
                        onClick={() => setPreviewPhoto(photo)}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-500/90 hover:bg-red-600"
                        onClick={() => handleDeletePhoto(photo)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
                {(company?.companyPhotos || []).length < 10 && (
                  <div className="border-2 border-dashed rounded-lg flex items-center justify-center h-32">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => e.target.files && handlePhotosUpload(e.target.files)}
                      disabled={uploadingPhotos}
                      className="hidden"
                      id="photos-upload"
                    />
                    <Label htmlFor="photos-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload size={24} className="text-gray-400 mb-1 dark:text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {uploadingPhotos ? "上传中..." : "上传照片"}
                      </span>
                    </Label>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">最多 10 张，每张不超过 5MB</p>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="outline"
                className="w-full border-2 border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                {saving ? "保存中..." : "保存修改"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {previewPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setPreviewPhoto(null)}
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
            >
              <X size={32} />
            </button>
            <img
              src={previewPhoto}
              alt="Preview"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default CompanyProfilePage;
