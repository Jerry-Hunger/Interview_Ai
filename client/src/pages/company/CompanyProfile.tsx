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
  industry?: string;
  companySize?: string;
  roleOffered?: string[];
};

const INDUSTRIES = [
  "互联网",
  "金融",
  "教育",
  "医疗健康",
  "电子商务",
  "游戏",
  "企业服务",
  "硬件/物联网",
  "汽车交通",
  "房产家居",
  "餐饮旅游",
  "广告营销",
  "其他",
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10人" },
  { value: "11-50", label: "11-50人" },
  { value: "51-200", label: "51-200人" },
  { value: "201-500", label: "201-500人" },
  { value: "500+", label: "500+人" },
];

const CompanyProfilePage = () => {
  const [company, setCompany] = useState<CompanyUser | null>(null);
  const [originalCompany, setOriginalCompany] = useState<CompanyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [cardValues, setCardValues] = useState<Partial<CompanyUser>>({});
  const [newRoleTag, setNewRoleTag] = useState("");
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
      setOriginalCompany(res.data);
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

  const startEdit = () => {
    setCardValues({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setCardValues({});
    setCompany(originalCompany);
  };

  const handleCardChange = (field: keyof CompanyUser, value: string | string[]) => {
    setCardValues((prev) => ({ ...prev, [field]: value }));
  };

  const getCardValue = (field: keyof CompanyUser): string | string[] | undefined => {
    return (cardValues[field] ?? (company as CompanyUser)?.[field]) as string | string[] | undefined;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Partial<CompanyUser> = {};
      const c = company as CompanyUser;
      const orig = originalCompany as CompanyUser;

      if (cardValues.industry !== undefined && cardValues.industry !== orig.industry) {
        updates.industry = cardValues.industry;
      }
      if (cardValues.companySize !== undefined && cardValues.companySize !== orig.companySize) {
        updates.companySize = cardValues.companySize;
      }
      if (cardValues.roleOffered !== undefined) {
        updates.roleOffered = cardValues.roleOffered;
      }
      if (c.companyName !== undefined && c.companyName !== orig.companyName) {
        updates.companyName = c.companyName;
      }
      if (c.companyDescription !== orig.companyDescription) {
        updates.companyDescription = c.companyDescription;
      }
      if (c.companyLocation !== orig.companyLocation) {
        updates.companyLocation = c.companyLocation;
      }
      if (c.companyWebsite !== orig.companyWebsite) {
        updates.companyWebsite = c.companyWebsite;
      }

      await axiosInstance.put("/company/profile", updates, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast({ title: "保存成功" });
      setIsEditing(false);
      setCardValues({});
      await fetchProfile();
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

  const addRoleTag = () => {
    const tag = newRoleTag.trim();
    if (!tag) return;
    const current = (getCardValue("roleOffered") as string[]) || [];
    if (!current.includes(tag)) {
      handleCardChange("roleOffered", [...current, tag]);
    }
    setNewRoleTag("");
  };

  const removeRoleTag = (tag: string) => {
    const current = (getCardValue("roleOffered") as string[]) || [];
    handleCardChange("roleOffered", current.filter((t) => t !== tag));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-300">
        加载中...
      </div>
    );
  }

  const c = company as CompanyUser;
  const industryLabel = INDUSTRIES.find((i) => i === getCardValue("industry")) || getCardValue("industry") || "未设置";
  const sizeEntry = COMPANY_SIZES.find((s) => s.value === getCardValue("companySize"));
  const sizeLabel = sizeEntry ? sizeEntry.label : "未设置";
  const roleTags = (getCardValue("roleOffered") as string[]) || [];

  return (
    <>
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card className="shadow-lg rounded-2xl bg-white dark:bg-[#181A2A]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl font-bold text-purple-700 dark:text-purple-300">
              <div className="flex items-center gap-2">
                <Building size={20} /> 公司资料
              </div>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEdit}
                  className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-950"
                >
                  编辑
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
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
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-white dark:from-[#1a1c2e] dark:via-[#1f2033] dark:to-[#181A2A] rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/40 shadow-sm">
              <div className="flex items-start gap-5">
                <div className="relative shrink-0">
                  <AvatarUploader
                    avatarUrl={c?.companyLogoUrl}
                    userName={c?.companyName || "Logo"}
                    size="xl"
                    dialogTitle="裁剪 Logo"
                    uploadEndpoint="/upload/logo"
                    onUploadSuccess={(url) => {
                      setCompany((prev) => prev ? { ...prev, companyLogoUrl: url } : null);
                      toast({ title: "Logo 上传成功" });
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 truncate">
                    {c?.companyName || "未设置公司名称"}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {isEditing ? (
                      <>
                        <select
                          className="cursor-pointer rounded-full border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-xs text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          value={getCardValue("industry") as string || ""}
                          onChange={(e) => handleCardChange("industry", e.target.value)}
                        >
                          <option value="">选择行业</option>
                          {INDUSTRIES.map((ind) => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                        <select
                          className="cursor-pointer rounded-full border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 text-xs text-purple-700 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          value={getCardValue("companySize") as string || ""}
                          onChange={(e) => handleCardChange("companySize", e.target.value)}
                        >
                          <option value="">选择规模</option>
                          {COMPANY_SIZES.map((sz) => (
                            <option key={sz.value} value={sz.value}>{sz.label}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        {industryLabel !== "未设置" && (
                          <span className="inline-flex items-center rounded-full border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                            {industryLabel}
                          </span>
                        )}
                        {sizeLabel !== "未设置" && (
                          <span className="inline-flex items-center rounded-full border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                            {sizeLabel}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      招聘职位
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {roleTags.length > 0 ? (
                        roleTags.map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all ${
                              isEditing
                                ? "cursor-pointer border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                                : "border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#23263a] text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {tag}
                            {isEditing && (
                              <button
                                onClick={() => removeRoleTag(tag)}
                                className="ml-1.5 cursor-pointer hover:text-red-500 flex items-center"
                              >
                                <X size={10} />
                              </button>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">暂无招聘职位</span>
                      )}
                      {isEditing && (
                        <div className="inline-flex items-center gap-1.5">
                          <Input
                            className="h-6 w-36 text-xs rounded-full border-dashed border-gray-300 dark:border-gray-600 bg-transparent dark:bg-transparent focus:border-indigo-400 focus:ring-0 pl-3 pr-2"
                            placeholder="添加职位..."
                            value={newRoleTag}
                            onChange={(e) => setNewRoleTag(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addRoleTag();
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs rounded-full border border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-400 text-gray-500 dark:text-gray-400"
                            onClick={addRoleTag}
                          >
                            <span className="text-base leading-none">+</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">公司名称</Label>
                <Input
                  id="companyName"
                  value={company?.companyName || ""}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="请输入公司名称"
                  disabled={!isEditing}
                  className="placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-80"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={company?.email || ""}
                  disabled
                  placeholder="用于给候选人发送面试邀请"
                  className="placeholder:text-gray-400 dark:placeholder:text-gray-500 opacity-60"
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
                  disabled={!isEditing}
                  className="placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-80"
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
                    disabled={!isEditing}
                    className="placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">公司官网</Label>
                  <Input
                    id="companyWebsite"
                    value={company?.companyWebsite || ""}
                    onChange={(e) => updateField("companyWebsite", e.target.value)}
                    placeholder="https://example.com"
                    disabled={!isEditing}
                    className="placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-80"
                  />
                </div>
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
                    <div className="absolute inset-0 bg-black/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-gray-800 dark:bg-gray-700/90 dark:hover:bg-gray-700 dark:text-gray-100"
                        onClick={() => setPreviewPhoto(photo)}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-500/90 hover:bg-red-600 dark:bg-red-600/90 dark:hover:bg-red-600"
                        onClick={() => handleDeletePhoto(photo)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
                {(company?.companyPhotos || []).length < 10 && (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center h-32">
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
