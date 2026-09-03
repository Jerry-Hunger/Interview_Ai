import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import { useToast } from "@/hooks/use-toast";

/** 头像/Logo 上传大小限制：2MB（与后端 MAX_AVATAR_SIZE 对齐） */
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "2MB";

const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VALID_TYPES_LABEL = "JPG、PNG 或 WebP";

type SimpleAvatarUploaderProps = {
  avatarUrl?: string;
  userName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onUploadSuccess?: (url: string) => void;
  uploadEndpoint?: string;
};

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
};

const SimpleAvatarUploader: React.FC<SimpleAvatarUploaderProps> = ({
  avatarUrl,
  userName = "U",
  size = "lg",
  onUploadSuccess,
  uploadEndpoint = "/upload/avatar",
}) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!VALID_TYPES.includes(file.type)) {
      toast({ title: "格式不支持", description: `请选择 ${VALID_TYPES_LABEL} 格式的图片`, variant: "destructive" });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "文件过大", description: `图片大小不能超过 ${MAX_FILE_SIZE_LABEL}，当前文件 ${(file.size / 1024 / 1024).toFixed(1)}MB`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axiosInstance.post(uploadEndpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data.success && onUploadSuccess) {
        onUploadSuccess(response.data.url);
      }
    } catch (err: unknown) {
      // 优先显示后端返回的错误信息
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr.response?.data?.error || "上传失败，请稍后重试";
      toast({ title: "上传失败", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative inline-block">
      <Avatar
        className={`${sizeClasses[size]} cursor-pointer ring-2 ring-transparent hover:ring-indigo-300 dark:hover:ring-indigo-600 transition-all`}
        onClick={handleClick}
      >
        <AvatarImage src={avatarUrl} alt={userName} />
        <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xl font-semibold">
          {userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <button
        onClick={handleClick}
        disabled={loading}
        className="absolute bottom-0 right-0 bg-indigo-600 dark:bg-indigo-500 text-white p-1.5 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition"
        title="上传头像"
      >
        {loading ? (
          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera size={14} />
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default SimpleAvatarUploader;
