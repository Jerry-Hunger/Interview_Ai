// client/src/components/ui/AvatarUploader.tsx
import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";

type AvatarUploaderProps = {
  avatarUrl?: string;
  userName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onUploadSuccess?: (url: string) => void;
};

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
};

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  avatarUrl,
  userName = "U",
  size = "lg",
  onUploadSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("请选择 JPG、PNG 或 WebP 格式的图片");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("图片大小不能超过 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post("/upload/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success && onUploadSuccess) {
        onUploadSuccess(response.data.url);
      }
    } catch (err) {
      console.error("上传头像失败:", err);
      alert("上传失败，请稍后重试");
      setPreviewUrl(avatarUrl);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative inline-block">
      <Avatar className={`${sizeClasses[size]} cursor-pointer`} onClick={handleClick}>
        <AvatarImage src={previewUrl} alt={userName} />
        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl font-semibold">
          {userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <button
        onClick={handleClick}
        disabled={loading}
        className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition"
        title="上传头像"
      >
        <Camera size={14} />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default AvatarUploader;