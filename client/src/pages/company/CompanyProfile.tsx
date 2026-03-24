import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building, Upload, Trash2 } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type CompanyUser = {
  companyName?: string;
  companyLogoUrl?: string;
  companyPhotos?: string[];
  companyDescription?: string;
  companyLocation?: string;
  companyLocationCoords?: { lat: number; lng: number };
  companyWebsite?: string;
};

const CompanyProfilePage = () => {
  const [company, setCompany] = useState<CompanyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const { toast } = useToast();

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

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosInstance.post("/upload/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.data.success) {
        setCompany((prev) => prev ? { ...prev, companyLogoUrl: res.data.url } : null);
        toast({ title: "Logo 上传成功" });
      }
    } catch (err) {
      console.error("上传失败:", err);
      toast({ title: "上传失败", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
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
                {company?.companyLogoUrl ? (
                  <img
                    src={company.companyLogoUrl}
                    alt="Logo"
                    className="w-24 h-24 object-contain rounded-lg border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-gray-400">
                    <Building size={32} />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                    disabled={uploadingLogo}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <Button variant="outline" disabled={uploadingLogo} asChild>
                      <span>{uploadingLogo ? "上传中..." : "上传 Logo"}</span>
                    </Button>
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">支持 JPG、PNG、WebP，不超过 2MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">公司名称</Label>
              <Input
                id="companyName"
                value={company?.companyName || ""}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="请输入公司名称"
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">公司官网</Label>
                <Input
                  id="companyWebsite"
                  value={company?.companyWebsite || ""}
                  onChange={(e) => updateField("companyWebsite", e.target.value)}
                  placeholder="https://example.com"
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
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                      onClick={() => handleDeletePhoto(photo)}
                    >
                      <Trash2 size={14} />
                    </Button>
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
                      <Upload size={24} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">
                        {uploadingPhotos ? "上传中..." : "上传照片"}
                      </span>
                    </Label>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">最多 10 张，每张不超过 5MB</p>
            </div>

            <div className="pt-4">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "保存中..." : "保存修改"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CompanyProfilePage;